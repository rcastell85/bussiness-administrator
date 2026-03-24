import { useState, useEffect } from 'react';
import { X, Clock, Edit3, ShoppingBag, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import client from '../api/client';
import EditReferenceModal from './EditReferenceModal';

interface SaleDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    saleId: string | null;
    onSaleUpdated: () => void; // Trigger a refresh on Home
}

const SaleDetailsModal = ({ isOpen, onClose, saleId, onSaleUpdated }: SaleDetailsModalProps) => {
    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    
    // For Reference Edit
    const [isRefModalOpen, setRefModalOpen] = useState(false);
    
    // For Customer Assign
    const [isAssigningCustomer, setIsAssigningCustomer] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');

    useEffect(() => {
        if (isOpen && saleId) {
            fetchSaleDetails();
        } else {
            setSale(null);
            setIsAssigningCustomer(false);
        }
    }, [isOpen, saleId]);

    const fetchSaleDetails = async () => {
        setLoading(true);
        try {
            const { data } = await client.get(`/sales/${saleId}`);
            setSale(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const { data } = await client.get('/customers');
            setCustomers(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveReference = async (newRef: string) => {
        if (!sale) return;
        await client.patch(`/sales/${sale.id}`, { paymentReference: newRef });
        setSale({ ...sale, paymentReference: newRef });
        onSaleUpdated();
    };

    const handleStartCustomerAssign = () => {
        setIsAssigningCustomer(true);
        fetchCustomers();
    };

    const handleSaveCustomer = async () => {
        if (!sale || !selectedCustomerId) return;
        try {
            await client.patch(`/sales/${sale.id}`, { customerId: selectedCustomerId });
            const assignedCustomer = customers.find(c => c.id === selectedCustomerId);
            setSale({ ...sale, customer: assignedCustomer, customerId: selectedCustomerId });
            setIsAssigningCustomer(false);
            onSaleUpdated();
        } catch (err) {
            console.error(err);
            alert('Error al asignar el cliente');
        }
    };

    if (!isOpen || (!sale && !loading)) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content details-modal">
                <div className="modal-header">
                    <h3>Detalles de la Venta</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                {loading ? (
                    <div className="loading-state">Cargando recibo...</div>
                ) : (
                    <div className="details-body">
                        <div className="summary-box">
                            <div className="total-big">${Number(sale.totalUsd).toFixed(2)}</div>
                            <div className="total-small">Bs. {Number(sale.totalVes).toFixed(2)}</div>
                            <div className="sale-meta">
                                <Clock size={14} style={{ marginRight: '4px' }} />
                                {format(new Date(sale.createdAt), "dd MMM yyyy, hh:mm a", { locale: es })}
                            </div>
                        </div>

                        <div className="info-section">
                            <div className="info-row">
                                <span className="info-label">Método:</span>
                                <strong>{sale.paymentMethod}</strong>
                            </div>
                            
                            <div className="info-row">
                                <span className="info-label">Referencia:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <strong>{sale.paymentReference || 'Ninguna'}</strong>
                                    <button className="inline-edit-btn" onClick={() => setRefModalOpen(true)}>
                                        <Edit3 size={14} /> Editar
                                    </button>
                                </div>
                            </div>

                            <div className="info-row">
                                <span className="info-label">Cliente:</span>
                                {isAssigningCustomer ? (
                                    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                        <select 
                                            value={selectedCustomerId} 
                                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                                            className="customer-select"
                                        >
                                            <option value="">Selecciona...</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.nombre}</option>
                                            ))}
                                        </select>
                                        <button className="save-btn" onClick={handleSaveCustomer}>OK</button>
                                        <button className="cancel-btn" onClick={() => setIsAssigningCustomer(false)}>X</button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <User size={16} color="var(--text-secondary)" />
                                        <strong>{sale.customer ? sale.customer.nombre : 'No asignado (Venta Rápida)'}</strong>
                                        <button className="inline-edit-btn" onClick={handleStartCustomerAssign}>
                                            <Edit3 size={14} /> Asignar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <h4><ShoppingBag size={18} /> Productos Vendidos ({sale.items?.length || 0})</h4>
                        <div className="items-list">
                            {sale.items?.map((item: any) => (
                                <div key={item.id} className="item-row">
                                    <div className="item-details">
                                        <strong>{item.product?.name || 'Producto Desconocido'}</strong>
                                        <span>{item.cantidad} x ${Number(item.precioUnitarioUsd).toFixed(2)}</span>
                                    </div>
                                    <div className="item-total">
                                        ${(item.cantidad * Number(item.precioUnitarioUsd)).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <EditReferenceModal
                isOpen={isRefModalOpen}
                onClose={() => setRefModalOpen(false)}
                currentReference={sale?.paymentReference}
                onSave={handleSaveReference}
            />

            <style>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; z-index: 1000;
                }
                .modal-content.details-modal {
                    background: white; width: 100%; max-width: 600px; margin: 0 auto; 
                    border-radius: 20px 20px 0 0; padding: 24px; animation: slideUp 0.3s ease-out;
                    max-height: 90vh; display: flex; flex-direction: column;
                }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0; }
                
                .details-body { flex: 1; overflow-y: auto; padding-right: 4px; }
                
                .summary-box {
                    background: #f8f9fa; padding: 20px; border-radius: var(--radius-md); text-align: center; margin-bottom: 24px;
                }
                .total-big { font-size: 32px; font-weight: 800; color: var(--text-primary); }
                .total-small { font-size: 16px; color: var(--brand); font-weight: 600; margin-bottom: 8px; }
                .sale-meta { display: flex; align-items: center; justify-content: center; font-size: 13px; color: var(--text-secondary); text-transform: capitalize; }
                
                .info-section {
                    background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 24px;
                    display: flex; flex-direction: column; gap: 12px;
                }
                .info-row { display: flex; align-items: center; justify-content: space-between; font-size: 14px; min-height: 28px; }
                .info-label { color: var(--text-secondary); font-weight: 500; }
                .info-row strong { color: var(--text-primary); }
                
                .inline-edit-btn {
                    display: flex; align-items: center; gap: 4px; color: var(--brand); background: #eef6ff; 
                    padding: 4px 10px; border-radius: 40px; font-size: 12px; font-weight: 600; transition: background 0.2s;
                }
                .inline-edit-btn:hover { background: #d0e4ff; }
                
                h4 { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 14px; margin-bottom: 12px; }
                
                .items-list { border: 1px solid var(--border); border-radius: var(--radius-md); background: #f8f9fa; }
                .item-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); }
                .item-row:last-child { border-bottom: none; }
                .item-details strong { display: block; font-size: 14px; margin-bottom: 2px; color: var(--text-primary); }
                .item-details span { font-size: 12px; color: var(--text-secondary); }
                .item-total { font-weight: 700; font-size: 15px; color: var(--text-primary); }
                
                .customer-select {
                    flex: 1; padding: 6px; border-radius: var(--radius-sm); border: 1px solid var(--border); font-size: 13px; outline: none;
                }
                .save-btn { background: var(--success); color: white; padding: 4px 12px; border-radius: var(--radius-sm); font-weight: 600; font-size: 12px; }
                .cancel-btn { background: var(--bg-primary); color: var(--text-secondary); padding: 4px 10px; border-radius: var(--radius-sm); font-weight: 600; }
                .loading-state { padding: 40px; text-align: center; color: var(--text-secondary); font-weight: 500; }
            `}</style>
        </div>
    );
};

export default SaleDetailsModal;
