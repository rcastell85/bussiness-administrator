import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import client from '../api/client';

interface TransformModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: any[];
    onSuccess: () => void;
}

const TransformModal = ({ isOpen, onClose, products, onSuccess }: TransformModalProps) => {
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');
    const [sourceQty, setSourceQty] = useState('');
    const [targetQty, setTargetQty] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSourceId('');
            setTargetId('');
            setSourceQty('');
            setTargetQty('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (sourceId === targetId) {
            alert('El producto de origen y destino no pueden ser el mismo.');
            return;
        }

        setLoading(true);
        try {
            await client.post('/products/transform', {
                sourceProductId: sourceId,
                targetProductId: targetId,
                sourceQuantity: Number(sourceQty),
                targetQuantity: Number(targetQty),
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Error al transformar productos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Producir / Transformar</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <p className="description">
                    Convierte materia prima en productos finales (ej. Kg de Harina ➡️ Unidades de Pan).
                </p>

                <form onSubmit={handleSubmit} className="form-layout">
                    <div className="transform-box origin">
                        <label>Consumir Materia Prima</label>
                        <select required value={sourceId} onChange={e => setSourceId(e.target.value)}>
                            <option value="">Selecciona producto...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockActual})</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            required min="1"
                            placeholder="Cantidad a consumir"
                            value={sourceQty}
                            onChange={e => setSourceQty(e.target.value)}
                        />
                    </div>

                    <div className="arrow-divider">
                        <ArrowRight size={24} color="var(--brand)" />
                    </div>

                    <div className="transform-box target">
                        <label>Producir Producto Final</label>
                        <select required value={targetId} onChange={e => setTargetId(e.target.value)}>
                            <option value="">Selecciona producto...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            required min="1"
                            placeholder="Cantidad producida"
                            value={targetQty}
                            onChange={e => setTargetQty(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="primary-btn" disabled={loading}>
                        {loading ? 'Procesando...' : 'Confirmar Producción'}
                    </button>
                </form>
            </div>

            <style>{`
         .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: white;
          width: 100%;
          max-width: 450px;
          border-radius: var(--radius-md);
          padding: 24px;
          animation: scaleUp 0.2s ease-out;
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        
        .description {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 20px;
          line-height: 1.4;
        }

        .form-layout { display: flex; flex-direction: column; gap: 12px; }
        
        .transform-box {
          background: #f8f9fa;
          padding: 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }
        .transform-box label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 12px;
          color: var(--text-primary);
        }
        .transform-box.origin label { color: var(--danger); }
        .transform-box.target label { color: var(--success); }
        
        .transform-box select, .transform-box input {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          outline: none;
          font-size: 14px;
          margin-bottom: 8px;
          background: white;
        }
        .transform-box input { margin-bottom: 0; }
        
        .arrow-divider {
          display: flex;
          justify-content: center;
          padding: 4px 0;
        }

        .primary-btn {
          width: 100%;
          padding: 14px;
          background: var(--brand);
          color: white;
          border-radius: var(--radius-sm);
          font-weight: 700;
          margin-top: 12px;
        }
        .primary-btn:disabled { opacity: 0.6; }
      `}</style>
        </div>
    );
};

export default TransformModal;
