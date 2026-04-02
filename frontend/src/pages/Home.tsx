import { useEffect, useState, useMemo } from 'react';
import client from '../api/client';
import { Download, TrendingUp, Clock, FileText, ChevronRight, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import SaleDetailsModal from '../components/SaleDetailsModal';

const Home = () => {
    const [summary, setSummary] = useState<any>(null);
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [saleSearch, setSaleSearch] = useState('');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

    const handleSaleClick = (saleId: string) => {
        setSelectedSaleId(saleId);
        setIsDetailsModalOpen(true);
    };

    useEffect(() => {
        if (timeFilter === 'custom' && (!customStart || !customEnd)) return;
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const now = new Date();
                let start: Date;
                let end = endOfDay(now);

                if (timeFilter === 'week') {
                    start = startOfWeek(now, { weekStartsOn: 1 });
                } else if (timeFilter === 'month') {
                    start = startOfMonth(now);
                } else if (timeFilter === 'custom' && customStart && customEnd) {
                    start = startOfDay(new Date(customStart + 'T00:00:00'));
                    end = endOfDay(new Date(customEnd + 'T00:00:00'));
                } else {
                    start = startOfDay(now);
                }

                const [summaryRes, salesRes] = await Promise.all([
                    client.get(`/reports/summary?start=${start.toISOString()}&end=${end.toISOString()}`),
                    client.get('/sales')
                ]);

                setSummary(summaryRes.data);

                const filteredSales = salesRes.data.filter((s: any) => {
                    const d = new Date(s.createdAt);
                    return d >= start && d <= end;
                });

                setSales(filteredSales);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [timeFilter, customStart, customEnd]);

    const filteredSales = useMemo(() => {
        const q = saleSearch.toLowerCase().trim();
        if (!q) return sales;
        return sales.filter(s => {
            const fields = [
                s.paymentType,
                s.paymentMethod,
                s.paymentReference,
                s.customer?.nombre,
                Number(s.totalUsd).toFixed(2),
                Number(s.totalVes).toFixed(2),
                ...(s.items || []).map((i: any) => i.product?.name),
            ].filter(Boolean).join(' ').toLowerCase();
            return fields.includes(q);
        });
    }, [sales, saleSearch]);

    const handleGenerateManagementReport = async () => {
        try {
            setLoading(true);
            const now = new Date();
            let start: Date;
            let end = endOfDay(now);

            if (timeFilter === 'week') {
                start = startOfWeek(now, { weekStartsOn: 1 });
            } else if (timeFilter === 'month') {
                start = startOfMonth(now);
            } else if (timeFilter === 'custom' && customStart && customEnd) {
                start = startOfDay(new Date(customStart + 'T00:00:00'));
                end = endOfDay(new Date(customEnd + 'T00:00:00'));
            } else {
                start = startOfDay(now);
            }

            const { data } = await client.get(`/reports/performance?start=${start.toISOString()}&end=${end.toISOString()}`);
            
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const dateRangeStr = `${format(start, 'dd/MM/yyyy')} al ${format(end, 'dd/MM/yyyy')}`;

            // --- Header ---
            doc.setFontSize(22);
            doc.setTextColor(44, 62, 80);
            doc.text(data.tenant?.name || 'Reporte de Gestión', 14, 22);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            if (data.tenant?.rif) doc.text(`RIF: ${data.tenant.rif}`, 14, 28);
            doc.text(`Período: ${dateRangeStr}`, 14, 34);
            doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy hh:mm a")}`, pageWidth - 14, 34, { align: 'right' });

            doc.setDrawColor(200);
            doc.line(14, 38, pageWidth - 14, 38);

            // --- Section 1: Financial Summary ---
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text('1. Resumen Financiero', 14, 50);
            
            autoTable(doc, {
                startY: 55,
                head: [['Concepto', 'Monto USD', 'Monto VES', 'Cant. Ventas']],
                body: [[
                    'Total Ventas en el Período',
                    `$${Number(data.summary.totalUsd).toFixed(2)}`,
                    `Bs. ${Number(data.summary.totalVes).toFixed(2)}`,
                    data.summary.count
                ]],
                theme: 'grid',
                headStyles: { fillColor: [52, 73, 94] }
            });

            // --- Section 2: Sales per Product ---
            let currentY = (doc as any).lastAutoTable.finalY + 15;
            doc.text('2. Ventas por Producto', 14, currentY);
            
            autoTable(doc, {
                startY: currentY + 5,
                head: [['Producto', 'Cantidad Vendida', 'Ingreso Estimado ($)']],
                body: data.productSales.map((p: any) => [
                    p.name,
                    p.count,
                    `$${Number(p.total).toFixed(2)}`
                ]),
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] }
            });

            // --- Section 3: Inflow of Raw Materials ---
            currentY = (doc as any).lastAutoTable.finalY + 15;
            if (currentY > 250) { doc.addPage(); currentY = 20; }
            doc.text('3. Ingreso de Materia Prima (Insumos)', 14, currentY);

            if (data.supplyEntries.length === 0) {
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text('No se registraron ingresos de insumos en este período.', 14, currentY + 10);
                currentY += 15;
            } else {
                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['Insumo', 'Cantidad', 'Unidad', 'Nota', 'Fecha']],
                    body: data.supplyEntries.map((e: any) => [
                        e.name,
                        Number(e.quantity).toFixed(2),
                        e.unit,
                        e.note || '-',
                        format(new Date(e.date), 'dd/MM/yyyy')
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [39, 174, 96] }
                });
                currentY = (doc as any).lastAutoTable.finalY;
            }

            // --- Section 4: Current Inventory Snapshot ---
            currentY += 15;
            if (currentY > 230) { doc.addPage(); currentY = 20; }
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text('4. Inventario Actual de Productos', 14, currentY);
            
            autoTable(doc, {
                startY: currentY + 5,
                head: [['Producto', 'Stock Actual']],
                body: data.inventory.map((p: any) => [
                    p.name,
                    p.stockActual
                ]),
                theme: 'grid',
                headStyles: { fillColor: [127, 140, 141] }
            });

            doc.save(`Reporte_Gestion_${data.tenant?.name || 'Ventas'}_${format(start, 'yyyyMMdd')}.pdf`);
        } catch (err) {
            console.error('Error generating report:', err);
            alert('Error al generar el reporte.');
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePDF = () => {
        const doc = new jsPDF();
        const dateStr = format(new Date(), "dd 'de' MMMM, yyyy", { locale: es });

        doc.setFontSize(20);
        doc.text('Resumen de Caja Diario', 14, 22);
        doc.setFontSize(12);
        doc.text(`Fecha: ${dateStr}`, 14, 30);

        doc.setFontSize(14);
        doc.text('Totales', 14, 45);

        if (summary) {
            doc.setFontSize(11);
            doc.text(`Total Ingresos: $${Number(summary.totalUsd).toFixed(2)} | Bs. ${Number(summary.totalVes).toFixed(2)}`, 14, 52);
            doc.text(`Transacciones: ${summary.count}`, 14, 58);
        }

        const tableColumn = ["Hora", "Cliente/Tipo", "Método", "Total $", "Total Bs."];
        const tableRows: any[] = [];

        sales.forEach(sale => {
            const time = format(new Date(sale.createdAt), "hh:mm a");
            const type = sale.paymentType === 'fiao' ? `Crédito (${sale.customer?.nombre || 'N/A'})` : 'Contado';
            tableRows.push([
                time,
                type,
                sale.paymentMethod,
                `$${Number(sale.totalUsd).toFixed(2)}`,
                `Bs. ${Number(sale.totalVes).toFixed(2)}`
            ]);
        });

        autoTable(doc, {
            startY: 70,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [44, 62, 80] }
        });

        doc.save(`Cierre_Caja_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    if (loading) return <div style={{ padding: '20px' }}>Cargando resumen...</div>;


    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 16px 0', flexShrink: 0, gap: '12px' }}>
                <div className="filter-tabs">
                    <button className={timeFilter === 'today' ? 'active' : ''} onClick={() => setTimeFilter('today')}>Hoy</button>
                    <button className={timeFilter === 'week' ? 'active' : ''} onClick={() => setTimeFilter('week')}>Semana</button>
                    <button className={timeFilter === 'month' ? 'active' : ''} onClick={() => setTimeFilter('month')}>Mes</button>
                    <button className={timeFilter === 'custom' ? 'active' : ''} onClick={() => setTimeFilter('custom')}>Período</button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleGenerateManagementReport} className="secondary-btn" title="Reporte de Gestión Completo">
                        <FileText size={18} />
                        <span className="hide-mobile">Gestión</span>
                    </button>
                    <button onClick={handleGeneratePDF} className="export-btn" disabled={sales.length === 0 || loading} title="Cierre de Caja">
                        <Download size={18} />
                        <span className="hide-mobile">Cierre</span>
                    </button>
                </div>
            </div>

            {timeFilter === 'custom' && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
                    <input
                        type="date"
                        value={customStart}
                        onChange={e => setCustomStart(e.target.value)}
                        style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                    />
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>→</span>
                    <input
                        type="date"
                        value={customEnd}
                        onChange={e => setCustomEnd(e.target.value)}
                        style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                    />
                </div>
            )}

            {loading ? <div className="loading-state">Calculando totales...</div> : (
                <>
                    <div className="stats-grid" style={{ flexShrink: 0 }}>
                        <div className="stat-card primary">
                            <div className="stat-header">
                                <TrendingUp size={20} />
                                <span>Ingresos USD</span>
                            </div>
                            <div className="stat-value">${Number(summary?.totalUsd || 0).toFixed(2)}</div>
                        </div>

                        <div className="stat-card secondary">
                            <div className="stat-header">
                                <TrendingUp size={20} />
                                <span>Ingresos VES</span>
                            </div>
                            <div className="stat-value">Bs. {Number(summary?.totalVes || 0).toFixed(2)}</div>
                        </div>

                        <div className="stat-card tertiary">
                            <div className="stat-header">
                                <FileText size={20} />
                                <span>Transacciones</span>
                            </div>
                            <div className="stat-value">{summary?.count || 0}</div>
                        </div>
                    </div>

                    <h3 style={{ margin: '32px 0 12px', fontSize: '18px', flexShrink: 0 }}>Ventas del Periodo</h3>
                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, monto, método, referencia..."
                            value={saleSearch}
                            onChange={e => setSaleSearch(e.target.value)}
                            style={{ width: '100%', padding: '8px 8px 8px 32px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div className="recent-sales-list">
                        {filteredSales.length === 0 ? <p className="empty-state">{saleSearch ? 'Sin resultados para esa búsqueda.' : 'No hay ventas en este periodo.'}</p> : filteredSales.slice(0, 50).map(s => (
                            <div key={s.id} className="sale-item" onClick={() => handleSaleClick(s.id)}>
                                <div className="sale-info">
                                    <strong>{s.paymentType === 'fiao' ? `Fiao: ${s.customer?.nombre || '...'}` : 'Venta Contado'}</strong>
                                    <div className="sale-meta">
                                        <Clock size={12} style={{ marginRight: '4px' }} />
                                        {format(new Date(s.createdAt), "dd MMM, hh:mm a")} • {s.paymentMethod}
                                        {s.paymentReference && ` • Ref: ${s.paymentReference}`}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div className="sale-totals">
                                        <strong>${Number(s.totalUsd).toFixed(2)}</strong>
                                        <span>Bs. {Number(s.totalVes).toFixed(2)}</span>
                                    </div>
                                    <ChevronRight size={20} color="var(--text-secondary)" style={{ marginLeft: '12px', opacity: 0.5 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <SaleDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                saleId={selectedSaleId}
                onSaleUpdated={() => {
                    // Trigger refetch by toggling timeFilter back and forth? No, let's just use window.location.reload() for simplicity or let user just refresh if needed.
                    // Actually, modifying `s` in `sales` directly is better, but since it's a small app, let's just trigger a full fetch. 
                    window.location.reload();
                }}
            />

            <style>{`
                .export-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--text-primary);
                    color: white;
                    padding: 8px 16px;
                    border-radius: var(--radius-sm);
                    font-weight: 600;
                    font-size: 14px;
                    border: none;
                    cursor: pointer;
                }
                .export-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                
                .stats-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
                
                .stat-card {
                    padding: 24px;
                    border-radius: var(--radius-md);
                    color: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }
                .stat-card.primary { background: var(--text-primary); }
                .stat-card.secondary { background: var(--brand); color: white; }
                .stat-card.tertiary { background: white; color: var(--text-primary); border: 1px solid var(--border); }
                .stat-card.tertiary .stat-header { color: var(--text-secondary); }
                
                .stat-header {
                    display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; opacity: 0.9; margin-bottom: 12px;
                }
                .stat-value { font-size: 28px; font-weight: 700; }
                
                .recent-sales-list {
                    background: white; border-radius: var(--radius-md); border: 1px solid var(--border);
                    max-height: 520px; overflow-y: auto; margin-bottom: 80px;
                }
                .sale-item {
                    display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--border);
                    cursor: pointer; transition: background 0.2s;
                }
                .sale-item:hover { background: #f8f9fa; }
                .sale-item:last-child { border-bottom: none; }
                
                .sale-info strong { display: block; font-size: 15px; margin-bottom: 4px; color: var(--text-primary); }
                .sale-meta { display: flex; align-items: center; font-size: 12px; color: var(--text-secondary); text-transform: capitalize; }
                
                .sale-totals { text-align: right; display: flex; flex-direction: column; }
                .sale-totals strong { color: var(--brand); font-size: 16px; }
                .sale-totals span { font-size: 12px; color: var(--text-secondary); }
                
                .empty-state { text-align: center; padding: 24px; color: var(--text-secondary); font-size: 14px; }
                .loading-state { text-align: center; padding: 40px; color: var(--text-secondary); font-weight: 500; }

                .filter-tabs {
                    display: flex;
                    background: #f1f3f5;
                    padding: 4px;
                    border-radius: 8px;
                    gap: 4px;
                }
                .filter-tabs button {
                    background: transparent;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .filter-tabs button.active {
                    background: white;
                    color: var(--text-primary);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
            `}</style>
        </div>
    );
};

export default Home;
