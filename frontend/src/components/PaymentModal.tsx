import { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import client from '../api/client';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: any;
    onSuccess: () => void;
}

const PaymentModal = ({ isOpen, onClose, customer, onSuccess }: PaymentModalProps) => {
    const [amountUsd, setAmountUsd] = useState('');
    const [paymentReference, setPaymentReference] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAmountUsd('');
            setPaymentReference('');
        }
    }, [isOpen]);

    if (!isOpen || !customer) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(amountUsd);
        if (amount <= 0 || amount > Number(customer.saldoPendienteUsd)) {
            alert('Monto inválido. Debe ser mayor a 0 y menor o igual a la deuda total.');
            return;
        }

        setLoading(true);
        try {
            const newDebt = Number(customer.saldoPendienteUsd) - amount;
            // Optimistic simple patch to the customer's debt. 
            // In a real accounting system, we would create a 'Payment' record.
            await client.patch(`/customers/${customer.id}`, { 
                saldoPendienteUsd: newDebt,
                paymentReference: paymentReference || undefined 
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error al procesar el abono');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Abonar Pago</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <div className="debt-summary">
                    <span>Cliente: <strong>{customer.nombre}</strong></span>
                    <span>Deuda Total: <strong style={{ color: 'var(--danger)' }}>${Number(customer.saldoPendienteUsd).toFixed(2)}</strong></span>
                </div>

                <form onSubmit={handleSubmit} className="form-layout">
                    <div className="input-group">
                        <label>Monto a Abonar (USD)</label>
                        <div className="amount-input-wrapper">
                            <DollarSign className="currency-icon" size={20} />
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={Number(customer.saldoPendienteUsd)}
                                required
                                value={amountUsd}
                                onChange={e => setAmountUsd(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Referencia (Opcional)</label>
                        <input
                            type="text"
                            value={paymentReference}
                            onChange={e => setPaymentReference(e.target.value)}
                            placeholder="Ej: 123456"
                            className="ref-input"
                        />
                    </div>

                    <button type="submit" className="primary-btn" disabled={loading || !amountUsd}>
                        {loading ? 'Procesando...' : 'Registrar Pago'}
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
                
                .debt-summary {
                    background: #f8f9fa; padding: 12px; border-radius: var(--radius-sm); margin-bottom: 20px;
                    display: flex; flex-direction: column; gap: 4px; font-size: 14px; color: var(--text-secondary);
                }
                .debt-summary strong { color: var(--text-primary); }
                
                .form-layout { display: flex; flex-direction: column; gap: 16px; }
                .input-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-secondary); }
                
                .amount-input-wrapper { position: relative; display: flex; align-items: center; }
                .currency-icon { position: absolute; left: 12px; color: var(--text-secondary); }
                .amount-input-wrapper input { 
                    width: 100%; padding: 12px 12px 12px 40px; border: 1px solid var(--border); 
                    border-radius: var(--radius-sm); outline: none; font-size: 16px; font-weight: 600;
                }
                .amount-input-wrapper input:focus { border-color: var(--brand); }
                
                .ref-input {
                    width: 100%; padding: 12px; border: 1px solid var(--border);
                    border-radius: var(--radius-sm); outline: none; font-size: 15px;
                }
                .ref-input:focus { border-color: var(--brand); }
                
                .primary-btn { width: 100%; padding: 14px; background: var(--success); color: white; border-radius: var(--radius-sm); font-weight: 700; margin-top: 8px; }
                .primary-btn:disabled { opacity: 0.6; }
            `}</style>
        </div>
    );
};

export default PaymentModal;
