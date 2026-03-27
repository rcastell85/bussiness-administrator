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
    const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');
    const [saleSearch, setSaleSearch] = useState('');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

    const handleSaleClick = (saleId: string) => {
        setSelectedSaleId(saleId);
        setIsDetailsModalOpen(true);
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const now = new Date();
                let start: Date;
                let end = endOfDay(now);

                if (timeFilter === 'week') {
                    start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
                } else if (timeFilter === 'month') {
                    start = startOfMonth(now);
                } else {
                    start = startOfDay(now);
                }

                // Call backend with specific dates
                const [summaryRes, salesRes] = await Promise.all([
                    client.get(`/reports/summary?start=${start.toISOString()}&end=${end.toISOString()}`),
                    client.get('/sales')
                ]);

                setSummary(summaryRes.data);

                // Filter sales for the list view
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
    }, [timeFilter]);

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 24px 0', flexShrink: 0 }}>
                <div className="filter-tabs">
                    <button
                        className={timeFilter === 'today' ? 'active' : ''}
                        onClick={() => setTimeFilter('today')}
                    >Hoy</button>
                    <button
                        className={timeFilter === 'week' ? 'active' : ''}
                        onClick={() => setTimeFilter('week')}
                    >Semana</button>
                    <button
                        className={timeFilter === 'month' ? 'active' : ''}
                        onClick={() => setTimeFilter('month')}
                    >Mes</button>
                </div>
                <button onClick={handleGeneratePDF} className="export-btn" disabled={sales.length === 0 || loading}>
                    <Download size={18} />
                    <span>PDF</span>
                </button>
            </div>

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
