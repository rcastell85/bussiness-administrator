import { useState, useMemo } from 'react';
import client from '../api/client';
import { Search } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { ShoppingBag } from 'lucide-react';
import CheckoutModal from '../components/CheckoutModal';

const POS = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { items, addItem, removeItem, clearCart, getTotalUsd, getTotalVes } = useCartStore();
  const { exchangeRate } = useAuthStore();

  const fetchProducts = async () => {
    try {
      const { data } = await client.get('/products?sortBy=sales');
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products', err);
    } finally {
      setLoading(false);
    }
  };

  const getItemQuantity = (id: string) => {
    return items.find((i: any) => i.id === id)?.quantity || 0;
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  return (
    <div className="pos-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>Nueva Venta</h2>
        {items.length > 0 && (
          <button className="cancel-sale-btn" onClick={clearCart}>
            Cancelar Venta
          </button>
        )}
      </div>

      <div className="search-container">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          placeholder="Buscar producto..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((p) => {
            const qty = getItemQuantity(p.id);
            const remainingStock = p.stockActual - qty;
            const isOutOfStock = remainingStock <= 0;
            const isLowStock = remainingStock > 0 && remainingStock <= 5;
            const limitReached = remainingStock <= 0;

            return (
              <div 
                key={p.id} 
                className={`product-card ${qty > 0 ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`} 
                onClick={() => { 
                  // If we're not touching a control and qty is zero, we add
                  if (qty === 0 && !limitReached) addItem(p); 
                }}
              >
                {isOutOfStock && <div className="stock-badge danger">Agotado</div>}
                {isLowStock && !isOutOfStock && <div className="stock-badge warning">Quedan {remainingStock}</div>}

                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="product-image" />
                ) : (
                  <div className="initials">{p.name.charAt(0).toUpperCase()}</div>
                )}
                
                <div style={{ flex: 1, zIndex: 1 }}>
                  <div className="name">{p.name}</div>
                  <div className="price-stack">
                    <span className="usd">${Number(p.priceBaseUsd).toFixed(2)}</span>
                    <span className="ves">{(Number(p.priceBaseUsd) * exchangeRate).toFixed(2)} Bs.</span>
                  </div>
                </div>
                
                {qty > 0 && (
                  <div className="qty-controls">
                    <button type="button" className="control-btn minus" onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeItem(p.id); }}>-</button>
                    <span className="control-val">{qty}</span>
                    <button type="button" className="control-btn plus" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!limitReached) addItem(p); }} style={{ opacity: limitReached ? 0.3 : 1 }}>+</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Bar / Total */}
      <div 
        className={`checkout-bar ${items.length > 0 ? 'visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="totals">
          <div className="total-usd">${getTotalUsd().toFixed(2)}</div>
          <div className="total-ves">{getTotalVes(exchangeRate).toFixed(2)} Bs.</div>
        </div>
        <button className="checkout-btn" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          <ShoppingBag size={20} />
          <span>Cobrar</span>
        </button>
      </div>

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProducts}
        exchangeRate={exchangeRate}
      />


      <style>{`
        .pos-page { padding-bottom: 100px; }
        .search-container {
          position: relative;
          margin-bottom: 16px;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #adb5bd;
        }
        .search-input {
          width: 100%;
          padding: 10px 10px 10px 38px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .search-input:focus { border-color: var(--brand); }
        
        .cancel-sale-btn {
            background: #ffe3e3;
            color: var(--danger);
            border: none;
            padding: 6px 12px;
            border-radius: var(--radius-sm);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        .cancel-sale-btn:hover { background: #ffc9c9; }
        
        .product-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .product-card {
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          position: relative;
          transition: border-color 0.2s;
        }
        .product-card.selected {
          border-color: var(--brand);
          background: #f0f7ff;
        }
        .product-card.out-of-stock {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f8f9fa;
        }
        .stock-badge {
          position: absolute;
          top: -8px; right: -8px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 800;
          color: white;
          z-index: 10;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stock-badge.danger { background: var(--danger); }
        .stock-badge.warning { background: #fd7e14; }

        .product-image {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--border);
        }
        .initials {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .name { font-size: 14px; font-weight: 600; line-height: 1.2; margin-bottom: 2px; }
        .price-stack { display: flex; flex-direction: column; }
        .usd { font-weight: 700; color: var(--text-primary); }
        .ves { font-size: 11px; color: var(--text-secondary); font-style: italic; }
        
        .qty-controls {
            display: flex;
            align-items: center;
            background: white;
            border-radius: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            overflow: hidden;
            position: absolute;
            right: 8px;
            height: 40px;
            z-index: 20;
        }
        .control-btn {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 22px;
            background: #f8f9fa;
        }
        .control-btn.minus { color: var(--danger); }
        .control-btn.plus { color: var(--brand); }
        .control-val {
            font-weight: 700;
            padding: 0 6px;
            font-size: 16px;
        }

        .checkout-bar {
          position: fixed;
          bottom: 74px; /* Above bottom nav */
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 32px);
          max-width: 568px;
          background: var(--text-primary);
          color: white;
          padding: 12px 20px;
          border-radius: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 999;
        }
        .checkout-bar.visible {
          opacity: 1;
          pointer-events: auto;
          bottom: 84px;
        }
        .total-usd { font-size: 20px; font-weight: 800; }
        .total-ves { font-size: 12px; opacity: 0.7; }
        .checkout-btn {
          background: var(--success);
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};

export default POS;
