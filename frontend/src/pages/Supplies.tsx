import { useState, useEffect } from 'react';
import client from '../api/client';
import { Plus, ArrowUpRight, ArrowDownRight, History, Trash2, Search } from 'lucide-react';
import SupplyModal from '../components/SupplyModal';
import SupplyAdjustmentModal from '../components/SupplyAdjustmentModal';
import { format } from 'date-fns';

const Supplies = () => {
    const [supplies, setSupplies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [selectedSupply, setSelectedSupply] = useState<any>(null);

    const fetchSupplies = async () => {
        setLoading(true);
        try {
            const { data } = await client.get('/supplies');
            setSupplies(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSupplies();
    }, []);

    const filteredSupplies = supplies.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdjust = (supply: any) => {
        setSelectedSupply(supply);
        setIsAdjustmentModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar este insumo? Se borrará también su historial.')) return;
        try {
            await client.delete(`/supplies/${id}`);
            fetchSupplies();
        } catch (err) {
            alert('Error al eliminar');
        }
    };

    return (
        <div style={{ paddingBottom: '80px' }}>
            <div className="header-actions">
                <h2>Insumos (Materia Prima)</h2>
                <button className="primary-btn" onClick={() => { setSelectedSupply(null); setIsModalOpen(true); }}>
                    <Plus size={18} /> Nuevo Insumo
                </button>
            </div>

            <div className="search-container" style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar insumo..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="search-input"
                        style={{ paddingLeft: '40px', width: '100%' }}
                    />
                </div>
            </div>

            {loading ? <p>Cargando...</p> : (
                <div className="supplies-grid">
                    {filteredSupplies.map(s => (
                        <div key={s.id} className="supply-card">
                            <div className="supply-info">
                                <h3>{s.name}</h3>
                                <div className="stock-badge">
                                    <span className="stock-value">{Number(s.stockActual).toFixed(2)}</span>
                                    <span className="stock-unit">{s.unit}</span>
                                </div>
                            </div>
                            
                            <div className="supply-actions">
                                <button className="action-btn adjust" onClick={() => handleAdjust(s)}>
                                    <History size={16} /> Movimiento
                                </button>
                                <button className="action-btn delete" onClick={() => handleDelete(s.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {s.history && s.history.length > 0 && (
                                <div className="mini-history">
                                    <h4>Últimos movimientos</h4>
                                    {s.history.map((h: any) => (
                                        <div key={h.id} className="history-row">
                                            {h.type === 'ENTRY' ? <ArrowUpRight size={12} color="var(--success)" /> : <ArrowDownRight size={12} color="var(--danger)" />}
                                            <span>{Number(h.quantity).toFixed(2)} {s.unit}</span>
                                            <span className="history-date">{format(new Date(h.createdAt), 'dd/MM HH:mm')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <SupplyModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchSupplies} 
            />

            <SupplyAdjustmentModal 
                isOpen={isAdjustmentModalOpen}
                onClose={() => setIsAdjustmentModalOpen(false)}
                supply={selectedSupply}
                onSuccess={fetchSupplies}
            />

            <style>{`
                .supplies-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
                @media (min-width: 768px) { .supplies-grid { grid-template-columns: 1fr 1fr; } }

                .supply-card {
                    background: white;
                    padding: 20px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .supply-info { display: flex; justify-content: space-between; align-items: flex-start; }
                .supply-info h3 { margin: 0; font-size: 18px; color: var(--text-primary); }

                .stock-badge {
                    background: #f0f7ff;
                    padding: 8px 12px;
                    border-radius: 8px;
                    display: flex;
                    align-items: baseline;
                    gap: 4px;
                }
                .stock-value { font-size: 20px; font-weight: 700; color: var(--brand); }
                .stock-unit { font-size: 12px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; }

                .supply-actions { display: flex; gap: 8px; }
                .action-btn {
                    flex: 1;
                    padding: 8px;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .action-btn.adjust:hover { background: #f8f9fa; border-color: var(--brand); color: var(--brand); }
                .action-btn.delete { flex: 0; color: var(--text-secondary); }
                .action-btn.delete:hover { color: var(--danger); border-color: var(--danger); background: #fff5f5; }

                .mini-history {
                    border-top: 1px solid #f1f3f5;
                    padding-top: 12px;
                }
                .mini-history h4 { margin: 0 0 8px 0; font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
                .history-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    margin-bottom: 4px;
                    color: var(--text-primary);
                }
                .history-date { margin-left: auto; color: var(--text-secondary); font-size: 11px; }

                .header-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
            `}</style>
        </div>
    );
};

export default Supplies;
