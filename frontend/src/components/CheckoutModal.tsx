import { useState, useEffect } from 'react';
import { X, CheckCircle2, Plus } from 'lucide-react';
import client from '../api/client';
import { useCartStore } from '../store/useCartStore';
import CustomerModal from './CustomerModal';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    exchangeRate: number;
}

const CheckoutModal = ({ isOpen, onClose, exchangeRate }: CheckoutModalProps) => {
    const { items, getTotalUsd, clearCart } = useCartStore();
    const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO_USD' | 'PAGO_MOVIL' | 'EFECTIVO_VES' | 'TRANSFERENCIA' | 'ZELLE'>('EFECTIVO_USD');
    const [isCredit, setIsCredit] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [paymentReference, setPaymentReference] = useState('');

    const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);

    const fetchCustomers = async (autoSelectLast = false) => {
        try {
            const { data } = await client.get('/customers');
            setCustomers(data);
            if (autoSelectLast && data.length > 0) {
                // Assuming the new customer is at the end of the array, or we can just pick the last item
                setSelectedCustomerId(data[data.length - 1].id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
            setPaymentReference('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const saleData = {
                items: items.map((i: any) => ({
                    productId: i.id,
                    cantidad: i.quantity,
                })),
                paymentType: isCredit ? 'fiao' : 'contado',
                paymentMethod: isCredit ? 'credito' : paymentMethod,
                paymentReference: paymentReference || undefined,
                customerId: isCredit ? selectedCustomerId : undefined,
            };

            await client.post('/sales', saleData);
            setSuccess(true);
            setTimeout(() => {
                clearCart();
                setSuccess(false);
                onClose();
            }, 1500);
        } catch (err) {
            alert('Error al realizar la venta');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {!success ? (
                    <>
                        <div className="modal-header">
                            <h3>Finalizar Venta</h3>
                            <button onClick={onClose}><X size={24} /></button>
                        </div>

                        <div className="summary-box">
                            <div className="total-big">${getTotalUsd().toFixed(2)}</div>
                            <div className="total-small">{(getTotalUsd() * exchangeRate).toFixed(2)} Bs.</div>
                        </div>

                        <div className="section">
                            <label>Método de Pago</label>
                            <div className="payment-grid">
                                {[
                                    { id: 'EFECTIVO_USD', label: '$ Efectivo' },
                                    { id: 'PAGO_MOVIL', label: 'Pago Móvil' },
                                    { id: 'ZELLE', label: 'Zelle' },
                                    { id: 'EFECTIVO_VES', label: 'Bs. Efectivo' }
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        className={`payment-btn ${!isCredit && paymentMethod === m.id ? 'active' : ''}`}
                                        onClick={() => { setPaymentMethod(m.id as any); setIsCredit(false); }}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                                <button
                                    className={`payment-btn credit ${isCredit ? 'active' : ''}`}
                                    onClick={() => setIsCredit(true)}
                                >
                                    Fiao (Crédito)
                                </button>
                            </div>
                        </div>

                        {paymentMethod !== 'EFECTIVO_USD' && paymentMethod !== 'EFECTIVO_VES' && !isCredit && (
                            <div className="section" style={{ marginTop: '0' }}>
                                <label>Referencia (Opcional)</label>
                                <input
                                    type="text"
                                    value={paymentReference}
                                    onChange={e => setPaymentReference(e.target.value)}
                                    placeholder="Ej: 123456"
                                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }}
                                />
                            </div>
                        )}

                        {isCredit && (
                            <div className="section">
                                <label>Seleccionar Cliente</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select
                                        value={selectedCustomerId}
                                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                                        className="customer-select"
                                    >
                                        <option value="">-- Elige un cliente --</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                    <button
                                        className="add-customer-btn"
                                        onClick={() => setCustomerModalOpen(true)}
                                    >
                                        <Plus size={16} /> <span>Nuevo Cliente</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            className="confirm-btn"
                            disabled={loading || (isCredit && !selectedCustomerId)}
                            onClick={handleCheckout}
                        >
                            {loading ? 'Procesando...' : 'Confirmar Venta'}
                        </button>
                    </>
                ) : (
                    <div className="success-anim">
                        <CheckCircle2 size={80} color="var(--success)" />
                        <h2>¡Venta Exitosa!</h2>
                    </div>
                )}
            </div>

            <CustomerModal
                isOpen={isCustomerModalOpen}
                onClose={() => setCustomerModalOpen(false)}
                onSuccess={() => fetchCustomers(true)}
            />

            <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: flex-end;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          border-radius: 20px 20px 0 0;
          padding: 24px;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        
        .summary-box {
          background: #f8f9fa;
          padding: 20px;
          border-radius: var(--radius-md);
          text-align: center;
          margin-bottom: 24px;
        }
        .total-big { font-size: 32px; font-weight: 800; color: var(--text-primary); }
        .total-small { font-size: 16px; color: var(--text-secondary); }

        .section { margin-bottom: 20px; }
        .section label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--text-secondary); }
        
        .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .payment-btn {
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-weight: 600;
          background: white;
        }
        .payment-btn.active { border-color: var(--brand); background: #eef6ff; color: var(--brand); }
        .payment-btn.credit.active { border-color: var(--danger); background: #fff5f5; color: var(--danger); }

        .customer-select {
          flex: 1;
          padding: 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          outline: none;
        }

        .add-customer-btn {
          height: 48px;
          padding: 0 16px;
          border-radius: var(--radius-md);
          background: #eef6ff;
          color: var(--brand);
          border: 1px solid #d0e4ff;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .add-customer-btn:hover { background: #dbeaff; }

        .confirm-btn {
          width: 100%;
          padding: 16px;
          background: var(--text-primary);
          color: white;
          border-radius: 40px;
          font-weight: 700;
          font-size: 16px;
          margin-top: 10px;
        }
        .confirm-btn:disabled { opacity: 0.5; }

        .success-anim {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          text-align: center;
        }
        .success-anim h2 { margin-top: 16px; color: var(--text-primary); }
      `}</style>
        </div>
    );
};

export default CheckoutModal;
