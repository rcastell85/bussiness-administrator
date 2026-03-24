import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Edit3 } from 'lucide-react';
import client from '../api/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import EditReferenceModal from './EditReferenceModal';

interface CustomerHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: any;
}

const CustomerHistoryModal = ({ isOpen, onClose, customer }: CustomerHistoryModalProps) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<any>(null);

    const handleEditClick = (tx: any) => {
        setSelectedTx(tx);
        setIsEditModalOpen(true);
    };

    const handleSaveReference = async (newRef: string) => {
        if (!selectedTx) return;
        await client.patch(`/customers/transactions/${selectedTx.id}`, { paymentReference: newRef });
        setHistory(history.map(tx => tx.id === selectedTx.id ? { ...tx, paymentReference: newRef } : tx));
    };

    useEffect(() => {
        if (isOpen && customer) {
            const fetchHistory = async () => {
                setLoading(true);
                try {
                    const { data } = await client.get(`/customers/${customer.id}/history`);
                    setHistory(data);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchHistory();
        }
    }, [isOpen, customer]);

    if (!isOpen || !customer) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content history-modal">
                <div className="modal-header">
                    <h3>Historial de Movimientos</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <div className="debt-summary">
                    <span>Cliente: <strong>{customer.nombre}</strong></span>
                    <span>Deuda Actual: <strong style={{ color: Number(customer.saldoPendienteUsd) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        ${Number(customer.saldoPendienteUsd).toFixed(2)}
                    </strong></span>
                </div>

                <div className="history-list">
                    {loading ? (
                        <div className="loading-state">Cargando historial...</div>
                    ) : history.length === 0 ? (
                        <div className="empty-state">No hay movimientos registrados.</div>
                    ) : (
                        history.map((tx) => (
                            <div key={tx.id} className="history-item">
                                <div className="history-icon" style={{ background: tx.type === 'DEBT' ? '#fff5f5' : '#ebfbee', color: tx.type === 'DEBT' ? 'var(--danger)' : 'var(--success)' }}>
                                    {tx.type === 'DEBT' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                </div>
                                <div className="history-info">
                                    <strong>{tx.description || (tx.type === 'DEBT' ? 'Deuda Añadida' : 'Abono/Pago')}</strong>
                                    <span>
                                        {format(new Date(tx.createdAt), "dd MMM yyyy, hh:mm a", { locale: es })}
                                        {tx.paymentReference && ` • Ref: ${tx.paymentReference}`}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className="history-amount" style={{ color: tx.type === 'DEBT' ? 'var(--danger)' : 'var(--success)' }}>
                                        {tx.type === 'DEBT' ? '+' : '-'}${Number(tx.amountUsd).toFixed(2)}
                                    </div>
                                    <button className="edit-ref-btn" onClick={() => handleEditClick(tx)}>
                                        <Edit3 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <EditReferenceModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                currentReference={selectedTx?.paymentReference}
                onSave={handleSaveReference}
            />

            <style>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
                }
                .modal-content.history-modal {
                    background: white; width: 100%; max-width: 500px; max-height: 85vh; border-radius: var(--radius-md); 
                    padding: 24px; animation: scaleUp 0.2s ease-out; display: flex; flex-direction: column;
                }
                @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0; }
                
                .debt-summary {
                    background: #f8f9fa; padding: 12px; border-radius: var(--radius-sm); margin-bottom: 20px; flex-shrink: 0;
                    display: flex; flex-direction: column; gap: 4px; font-size: 14px; color: var(--text-secondary);
                }
                .debt-summary strong { color: var(--text-primary); }

                .history-list {
                    flex: 1; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-md);
                }
                
                .history-item {
                    display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border);
                }
                .history-item:last-child { border-bottom: none; }
                
                .history-icon {
                    width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }
                .history-info { flex: 1; display: flex; flex-direction: column; }
                .history-info strong { font-size: 14px; color: var(--text-primary); margin-bottom: 2px; }
                .history-info span { font-size: 11px; color: var(--text-secondary); text-transform: capitalize; }
                
                .history-amount { font-weight: 700; font-size: 15px; }
                
                .edit-ref-btn {
                    color: var(--text-secondary);
                    background: #f8f9fa;
                    width: 28px; height: 28px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .edit-ref-btn:hover { background: #e9ecef; color: var(--brand); }

                .empty-state { padding: 40px 20px; text-align: center; color: var(--text-secondary); font-size: 14px; }
                .loading-state { padding: 40px 20px; text-align: center; color: var(--text-secondary); font-size: 14px; font-weight: 500; }
            `}</style>
        </div>
    );
};

export default CustomerHistoryModal;
