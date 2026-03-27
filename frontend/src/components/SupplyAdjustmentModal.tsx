import { useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import client from '../api/client';

interface SupplyAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    supply: any;
    onSuccess: () => void;
}

const SupplyAdjustmentModal = ({ isOpen, onClose, supply, onSuccess }: SupplyAdjustmentModalProps) => {
    const [type, setType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
    const [quantity, setQuantity] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !supply) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quantity || Number(quantity) <= 0) return alert('Ingresa una cantidad válida');
        
        setLoading(true);
        try {
            await client.post('/supplies/history', {
                supplyItemId: supply.id,
                type,
                quantity: Number(quantity),
                note
            });
            onSuccess();
            onClose();
            setQuantity('');
            setNote('');
        } catch (err) {
            alert('Error al registrar movimiento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <div>
                        <h3 style={{ margin: 0 }}>Registrar Movimiento</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>{supply.name}</p>
                    </div>
                    <button onClick={onClose} className="close-btn"><X size={24} /></button>
                </div>

                <div className="type-selector">
                    <button 
                        className={`type-btn entry ${type === 'ENTRY' ? 'active' : ''}`}
                        onClick={() => setType('ENTRY')}
                    >
                        <ArrowUpRight size={20} /> Entrada
                    </button>
                    <button 
                        className={`type-btn exit ${type === 'EXIT' ? 'active' : ''}`}
                        onClick={() => setType('EXIT')}
                    >
                        <ArrowDownRight size={20} /> Salida
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
                    <div className="input-group">
                        <label>Cantidad ({supply.unit})</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            autoFocus
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="input-group">
                        <label>Nota / Concepto (Opcional)</label>
                        <input
                            type="text"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Ej: Compra semanal, Merma, etc."
                        />
                    </div>

                    <button type="submit" className={`confirm-btn ${type.toLowerCase()}`} disabled={loading}>
                        {loading ? 'Procesando...' : `Confirmar ${type === 'ENTRY' ? 'Entrada' : 'Salida'}`}
                    </button>
                </form>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
                    padding: 16px;
                }
                .modal-content {
                    background: white; width: 100%; max-width: 450px; border-radius: 20px; padding: 24px;
                }
                .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .close-btn { background: none; border: none; cursor: pointer; color: var(--text-secondary); }

                .type-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .type-btn {
                    padding: 16px; border-radius: 12px; border: 2px solid #f1f3f5; background: #f8f9fa;
                    display: flex; flex-direction: column; align-items: center; gap: 8px;
                    font-weight: 700; cursor: pointer; transition: all 0.2s;
                }
                .type-btn.entry.active { border-color: var(--success); background: #ebfbee; color: #2b8a3e; }
                .type-btn.exit.active { border-color: var(--danger); background: #fff5f5; color: #c92a2a; }

                .input-group { margin-bottom: 20px; }
                .input-group label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--text-secondary); }
                .input-group input {
                    width: 100%; padding: 14px; border-radius: 12px; border: 1px solid var(--border); outline: none; font-size: 16px;
                }

                .confirm-btn {
                    width: 100%; padding: 16px; color: white; border-radius: 40px;
                    font-weight: 700; font-size: 16px; border: none; cursor: pointer; margin-top: 12px;
                }
                .confirm-btn.entry { background: var(--success); }
                .confirm-btn.exit { background: var(--danger); }
                .confirm-btn:disabled { opacity: 0.5; }
            `}</style>
        </div>
    );
};

export default SupplyAdjustmentModal;
