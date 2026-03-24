import { useState, useEffect } from 'react';
import { X, Trash2, ImagePlus } from 'lucide-react';
import client from '../api/client';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: any; // If provided, edit mode
    onSuccess: () => void;
}

const ProductModal = ({ isOpen, onClose, product, onSuccess }: ProductModalProps) => {
    const [name, setName] = useState('');
    const [priceBaseUsd, setPriceBaseUsd] = useState('');
    const [stockActual, setStockActual] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (product) {
                setName(product.name);
                setPriceBaseUsd(product.priceBaseUsd.toString());
                setStockActual(product.stockActual.toString());
                setImageUrl(product.imageUrl || '');
            } else {
                setName('');
                setPriceBaseUsd('');
                setStockActual('');
                setImageUrl('');
            }
            setConfirmingDelete(false);
            setDeleteError('');
        }
    }, [isOpen, product]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                name,
                priceBaseUsd: Number(priceBaseUsd) || 0,
                stockActual: Number(stockActual) || 0,
                imageUrl: imageUrl || undefined,
            };

            if (product) {
                await client.patch(`/products/${product.id}`, data);
            } else {
                await client.post('/products', data);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error al guardar el producto');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = async () => {
        if (!product) return;
        setConfirmingDelete(true);
    };

    const confirmDelete = async () => {
        setLoading(true);
        setDeleteError('');
        try {
            await client.delete(`/products/${product.id}`);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setDeleteError('No se puede eliminar este producto porque ya tiene ventas o conversiones registradas.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{product ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                {confirmingDelete ? (
                    <div className="confirm-delete-view">
                        <Trash2 size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
                        <h4>¿Estás seguro?</h4>
                        <p>Vas a eliminar el producto <strong>"{product?.name}"</strong>. Esta acción no se puede deshacer.</p>

                        {deleteError && (
                            <div className="error-message">
                                {deleteError}
                            </div>
                        )}

                        <div className="action-buttons" style={{ marginTop: '24px' }}>
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => setConfirmingDelete(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="delete-btn-confirm"
                                onClick={confirmDelete}
                                disabled={loading}
                            >
                                {loading ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="form-layout">

                        <div className="image-upload-container">
                            <label htmlFor="product-image" className={`image-preview ${imageUrl ? 'has-image' : ''}`}>
                                {imageUrl ? (
                                    <img src={imageUrl} alt="Vista previa" />
                                ) : (
                                    <div className="upload-placeholder">
                                        <ImagePlus size={32} />
                                        <span>Añadir foto</span>
                                    </div>
                                )}
                            </label>
                            <input
                                type="file"
                                id="product-image"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div className="input-group">
                            <label>Nombre del Producto</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Ej. Harina de Trigo (Kg)"
                            />
                        </div>

                        <div className="input-row">
                            <div className="input-group">
                                <label>Costo o Precio (USD)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={priceBaseUsd}
                                    onChange={e => setPriceBaseUsd(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="input-group">
                                <label>Stock Inicial (Opcional)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={stockActual}
                                    onChange={e => setStockActual(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="action-buttons">
                            {product && (
                                <button
                                    type="button"
                                    className="delete-btn"
                                    onClick={handleDelete}
                                    disabled={loading}
                                    title="Eliminar Producto"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                            <button type="submit" className="primary-btn" disabled={loading}>
                                {loading ? 'Guardando...' : 'Guardar Producto'}
                            </button>
                        </div>
                    </form>
                )}
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
          max-width: 400px;
          border-radius: var(--radius-md);
          padding: 24px;
          animation: scaleUp 0.2s ease-out;
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .form-layout { display: flex; flex-direction: column; gap: 16px; }
        .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        
        .input-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--text-secondary);
        }
        .input-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          outline: none;
          font-size: 14px;
        }
        .input-group input:focus {
          border-color: var(--brand);
        }
        
        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        
        .delete-btn {
          padding: 14px;
          background: #ffe3e3;
          color: var(--danger);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .delete-btn:hover { background: #ffc9c9; }
        .delete-btn:disabled { opacity: 0.6; }

        .primary-btn {
          flex: 1;
          padding: 14px;
          background: var(--text-primary);
          color: white;
          border-radius: var(--radius-sm);
          font-weight: 700;
        }
        .primary-btn:disabled { opacity: 0.6; }

        .confirm-delete-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px 0 16px;
        }
        .confirm-delete-view h4 {
          font-size: 20px;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        .confirm-delete-view p {
          color: var(--text-secondary);
          font-size: 15px;
          line-height: 1.5;
        }
        .error-message {
          margin-top: 16px;
          padding: 12px;
          background: #fff5f5;
          color: var(--danger);
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 500;
        }
        .cancel-btn {
          flex: 1;
          padding: 14px;
          background: #f1f3f5;
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          font-weight: 600;
        }
        .delete-btn-confirm {
          flex: 1;
          padding: 14px;
          background: var(--danger);
          color: white;
          border-radius: var(--radius-sm);
          font-weight: 700;
        }
        .delete-btn-confirm:disabled { opacity: 0.6; }
      `}</style>
        </div>
    );
};

export default ProductModal;
