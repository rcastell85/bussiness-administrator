import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface EditReferenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentReference?: string;
    onSave: (newRef: string) => Promise<void>;
}

const EditReferenceModal = ({ isOpen, onClose, currentReference, onSave }: EditReferenceModalProps) => {
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setReference(currentReference || '');
        }
    }, [isOpen, currentReference]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(reference);
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error al guardar la referencia');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Editar Referencia</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="form-layout">
                    <div className="input-group">
                        <label>Número de Referencia</label>
                        <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="Ej: 987654"
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="primary-btn" disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </form>
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
                .input-group input { 
                    width: 100%; padding: 12px; border: 1px solid var(--border); 
                    border-radius: var(--radius-sm); outline: none; font-size: 15px;
                }
                .input-group input:focus { border-color: var(--brand); }
                
                .primary-btn { width: 100%; padding: 14px; background: var(--text-primary); color: white; border-radius: var(--radius-sm); font-weight: 700; margin-top: 8px; }
                .primary-btn:disabled { opacity: 0.6; }
            `}</style>
        </div>
    );
};

export default EditReferenceModal;
