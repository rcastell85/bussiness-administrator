import { useEffect, useState } from 'react';
import client from '../api/client';
import { Plus, DollarSign, History, Search } from 'lucide-react';
import CustomerModal from '../components/CustomerModal';
import PaymentModal from '../components/PaymentModal';
import CustomerHistoryModal from '../components/CustomerHistoryModal';

const Customers = () => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await client.get('/customers');
                setCustomers(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const { data } = await client.get('/customers');
            setCustomers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewCustomer = () => {
        setSelectedCustomer(null);
        setCustomerModalOpen(true);
    };

    const handleEditCustomer = (customer: any) => {
        setSelectedCustomer(customer);
        setCustomerModalOpen(true);
    };

    const handlePayment = (e: React.MouseEvent, customer: any) => {
        e.stopPropagation();
        setSelectedCustomer(customer);
        setPaymentModalOpen(true);
    };

    const handleHistory = (e: React.MouseEvent, customer: any) => {
        e.stopPropagation();
        setSelectedCustomer(customer);
        setHistoryModalOpen(true);
    };

    const filteredCustomers = customers.filter(c => c.nombre.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div style={{ paddingBottom: '80px' }}>
            <div className="header-actions">
                <h2>Clientes y Deudas</h2>
                <button className="icon-btn add" onClick={handleNewCustomer}>
                    <Plus size={20} />
                </button>
            </div>

            <div className="search-container" style={{ marginBottom: '16px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-secondary)' }} />
                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none', fontSize: '15px' }}
                />
            </div>

            <div className="customers-list">
                {loading ? <div className="loading-state">Cargando...</div> : filteredCustomers.length === 0 ? (
                    <p className="empty-state">No se encontraron clientes.</p>
                ) : filteredCustomers.map(c => (
                    <div key={c.id} className="customer-row" onClick={() => handleEditCustomer(c)}>
                        <div className="avatar">{c.nombre.charAt(0).toUpperCase()}</div>
                        <div style={{ flex: 1 }}>
                            <strong>{c.nombre}</strong>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Deuda acumulada</div>
                        </div>
                        <div className="debt-actions" onClick={(e) => e.stopPropagation()}>
                            <div className="amount" style={{ color: Number(c.saldoPendienteUsd) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                ${Number(c.saldoPendienteUsd).toFixed(2)}
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="history-btn" onClick={(e) => handleHistory(e, c)}>
                                    <History size={16} /> Ver
                                </button>
                                {Number(c.saldoPendienteUsd) > 0 && (
                                    <button className="payment-btn" onClick={(e) => handlePayment(e, c)}>
                                        <DollarSign size={16} /> Abonar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <CustomerModal
                isOpen={isCustomerModalOpen}
                onClose={() => setCustomerModalOpen(false)}
                customer={selectedCustomer}
                onSuccess={fetchCustomers}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                customer={selectedCustomer}
                onSuccess={fetchCustomers}
            />

            <CustomerHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                customer={selectedCustomer}
            />

            <style>{`
            .header-actions {
                display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
            }
            .icon-btn.add {
                width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                background: var(--success); color: white; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer;
            }
            .customers-list {
                background: white; border-radius: var(--radius-md); border: 1px solid var(--border); overflow: hidden;
            }
            .customer-row {
                display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s;
            }
            .customer-row:hover { background: #f8f9fa; }
            .customer-row:last-child { border-bottom: none; }
            
            .avatar {
                width: 40px; height: 40px; border-radius: 50%; background: #eef6ff; color: var(--brand);
                display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0;
            }
            
            .empty-state { padding: 24px; text-align: center; color: var(--text-secondary); }
            .loading-state { padding: 40px; text-align: center; color: var(--text-secondary); font-weight: 500; }
            
            .debt-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
            .amount { font-weight: 700; font-size: 15px; }

            .history-btn {
                background: #f1f3f5; color: var(--text-secondary); border: 1px solid var(--border); padding: 4px 10px; border-radius: 12px;
                font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px; cursor: pointer; transition: all 0.2s;
            }
            .history-btn:hover { background: #e9ecef; color: var(--text-primary); }

            .payment-btn {
                background: #ebfbee; color: var(--success); border: 1px solid #b2f2bb; padding: 4px 10px; border-radius: 12px;
                font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer; transition: all 0.2s;
            }
            .payment-btn:active { background: #d3f9d8; }
        `}</style>
        </div>
    );
};

export default Customers;

