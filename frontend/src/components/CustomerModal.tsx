import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import client from '../api/client';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer?: any;
    onSuccess: () => void;
}

const CustomerModal = ({ isOpen, onClose, customer, onSuccess }: CustomerModalProps) => {
    const [nombre, setNombre] = useState('');
    const [saldoPendienteUsd, setSaldoPendienteUsd] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (customer) {
                setNombre(customer.nombre);
                setSaldoPendienteUsd(customer.saldoPendienteUsd.toString());
            } else {
                setNombre('');
                setSaldoPendienteUsd('');
            }
            setConfirmingDelete(false);
            setDeleteError('');
        }
    }, [isOpen, customer]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                nombre,
                saldoPendienteUsd: Number(saldoPendienteUsd) || 0,
            };

            if (customer) {
                await client.patch(`/customers/${customer.id}`, data);
            } else {
                await client.post('/customers', data);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error al guardar el cliente');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!customer) return;
        setConfirmingDelete(true);
    };

    const confirmDelete = async () => {
        setLoading(true);
        setDeleteError('');
        try {
            await client.delete(`/customers/${customer.id}`);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setDeleteError('No se puede eliminar este cliente porque tiene ventas asociadas.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{customer ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                {confirmingDelete ? (
                    <div className="confirm-delete-view">
                        <Trash2 size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
                        <h4>¿Estás seguro?</h4>
                        <p>Vas a eliminar a <strong>"{customer?.nombre}"</strong>. Esta acción no se puede deshacer.</p>

                        {deleteError && (
                            <div className="error-message">
                                {deleteError}
                            </div>
                        )}

                        <div className="action-buttons" style={{ marginTop: '24px' }}>
                            <button type="button" className="cancel-btn" onClick={() => setConfirmingDelete(false)} disabled={loading}>
                                Cancelar
                            </button>
                            <button type="button" className="delete-btn-confirm" onClick={confirmDelete} disabled={loading}>
                                {loading ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="form-layout">
                        <div className="input-group">
                            <label>Nombre del Cliente</label>
                            <input
                                type="text"
                                required
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                placeholder="Ej. Juan Pérez"
                            />
                        </div>

                        <div className="input-group">
                            <label>Deuda Inicial / Actual (USD) - Opcional</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={saldoPendienteUsd}
                                onChange={e => setSaldoPendienteUsd(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="action-buttons">
                            {customer && (
                                <button type="button" className="delete-btn" onClick={handleDelete} disabled={loading}>
                                    <Trash2 size={20} />
                                </button>
                            )}
                            <button type="submit" className="primary-btn" disabled={loading}>
                                {loading ? 'Guardando...' : 'Guardar Cliente'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
                }
                .modal-content {
                    background: white; width: 100%; max-width: 400px; border-radius: var(--radius-md); padding: 24px; animation: scaleUp 0.2s ease-out;
                }
                @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .form-layout { display: flex; flex-direction: column; gap: 16px; }
                .input-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-secondary); }
                .input-group input { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); outline: none; font-size: 14px; }
                .input-group input:focus { border-color: var(--brand); }
                .action-buttons { display: flex; gap: 12px; margin-top: 8px; }
                .primary-btn { flex: 1; padding: 14px; background: var(--text-primary); color: white; border-radius: var(--radius-sm); font-weight: 700; }
                .primary-btn:disabled { opacity: 0.6; }
                .delete-btn { padding: 14px; background: #ffe3e3; color: var(--danger); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; }
                .confirm-delete-view { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 24px 0 16px; }
                .confirm-delete-view h4 { font-size: 20px; margin-bottom: 8px; color: var(--text-primary); }
                .confirm-delete-view p { color: var(--text-secondary); font-size: 15px; }
                .error-message { margin-top: 16px; padding: 12px; background: #fff5f5; color: var(--danger); border-radius: var(--radius-sm); font-size: 14px; font-weight: 500; }
                .cancel-btn { flex: 1; padding: 14px; background: #f1f3f5; color: var(--text-primary); border-radius: var(--radius-sm); font-weight: 600; }
                .delete-btn-confirm { flex: 1; padding: 14px; background: var(--danger); color: white; border-radius: var(--radius-sm); font-weight: 700; }
            `}</style>
        </div>
    );
};

export default CustomerModal;
