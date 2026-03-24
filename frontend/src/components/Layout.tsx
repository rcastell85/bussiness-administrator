import { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Package, Users, LogOut, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import GuidedTour from './GuidedTour';

const Layout = () => {
    const { logout, exchangeRate, fetchExchangeRate } = useAuthStore();
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        fetchExchangeRate();
    }, [fetchExchangeRate]);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await fetchExchangeRate();
        } catch (err) {
            console.error('Failed to fetch latest rate', err);
            alert('Error al traer la tasa más reciente');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="app-container">
            <GuidedTour />

            {/* Sticky Header with Rate */}
            <header className="sticky-header">
                <div style={{ fontWeight: '600' }}>AdminSaaS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        fontSize: '12px',
                        background: '#f1f3f5',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: '#495057'
                    }}>
                        1$ = <span style={{ fontWeight: '700', color: '#212529' }}>{exchangeRate ? exchangeRate.toFixed(2) : '...'} Bs.</span>
                    </div>
                    <button 
                        onClick={handleSync} 
                        style={{ color: '#495057', background: '#f1f3f5', border: 'none', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        disabled={isSyncing}
                    >
                        <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
                    </button>
                </div>
                <button onClick={logout} style={{ color: '#adb5bd' }}>
                    <LogOut size={18} />
                </button>
            </header>

            {/* Main Content */}
            <main className="scroll-content">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                <NavLink to="/" className={({ isActive }: { isActive: boolean }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Home size={24} />
                    <span>Inicio</span>
                </NavLink>
                <NavLink to="/pos" className={({ isActive }: { isActive: boolean }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <ShoppingCart size={24} />
                    <span>Ventas</span>
                </NavLink>
                <NavLink to="/inventory" className={({ isActive }: { isActive: boolean }) => `nav-item nav-inventory ${isActive ? 'active' : ''}`}>
                    <Package size={24} />
                    <span>Inventario</span>
                </NavLink>
                <NavLink to="/customers" className={({ isActive }: { isActive: boolean }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Users size={24} />
                    <span>Clientes</span>
                </NavLink>
            </nav>

            <style>{`
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          color: #adb5bd;
          font-size: 10px;
          font-weight: 500;
        }
        .nav-item.active {
          color: var(--brand);
        }
        .nav-item span {
          transition: transform 0.2s;
        }
        .nav-item:active span {
          transform: scale(0.9);
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
        </div>
    );
};

export default Layout;
