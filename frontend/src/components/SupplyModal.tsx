import { useState } from 'react';
import { X } from 'lucide-react';
import client from '../api/client';

interface SupplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const SupplyModal = ({ isOpen, onClose, onSuccess }: SupplyModalProps) => {
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('Kg');
    const [initialStock, setInitialStock] = useState('0');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await client.post('/supplies', { 
                name, 
                unit, 
                initialStock: Number(initialStock) 
            });
            onSuccess();
            onClose();
            setName('');
            setUnit('Kg');
            setInitialStock('0');
        } catch (err) {
            alert('Error al crear insumo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Nuevo Insumo</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Nombre del Insumo</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Harina de Trigo"
                        />
                    </div>

                    <div className="input-row">
                        <div className="input-group">
                            <label>Unidad de Medida</label>
                            <select value={unit} onChange={e => setUnit(e.target.value)}>
                                <option value="Kg">Kilogramos (Kg)</option>
                                <option value="Lts">Litros (Lts)</option>
                                <option value="Sacos">Sacos</option>
                                <option value="Und">Unidades (Und)</option>
                                <option value="Pkt">Paquetes</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Stock Inicial</label>
                            <input
                                type="number"
                                step="0.01"
                                value={initialStock}
                                onChange={e => setInitialStock(e.target.value)}
                            />
                        </div>
                    </div>

                    <button type="submit" className="confirm-btn" disabled={loading}>
                        {loading ? 'Guardando...' : 'Crear Insumo'}
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
                    background: white; width: 100%; max-width: 500px; border-radius: 16px; padding: 24px;
                }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .input-group { margin-bottom: 20px; }
                .input-group label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--text-secondary); }
                .input-group input, .input-group select {
                    width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border); outline: none;
                }
                .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .confirm-btn {
                    width: 100%; padding: 14px; background: var(--brand); color: white; border-radius: 40px;
                    font-weight: 700; font-size: 16px; border: none; cursor: pointer;
                }
                .confirm-btn:disabled { opacity: 0.5; }
            `}</style>
        </div>
    );
};

export default SupplyModal;
