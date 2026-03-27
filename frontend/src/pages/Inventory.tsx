import { useEffect, useState, useMemo } from 'react';
import client from '../api/client';
import { Plus, ArrowRightLeft, Search } from 'lucide-react';
import ProductModal from '../components/ProductModal';
import TransformModal from '../components/TransformModal';

const Inventory = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isProductModalOpen, setProductModalOpen] = useState(false);
    const [isTransformModalOpen, setTransformModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) return products;
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data } = await client.get('/products');
            setProducts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleEditProduct = (product: any) => {
        setSelectedProduct(product);
        setProductModalOpen(true);
    };

    const handleNewProduct = () => {
        setSelectedProduct(null);
        setProductModalOpen(true);
    };

    return (
        <div style={{ paddingBottom: '80px' }}>
            <div className="header-actions">
                <h2>Productos</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="text-btn transform" onClick={() => setTransformModalOpen(true)}>
                        <ArrowRightLeft size={16} /> Transformar
                    </button>
                    <button className="text-btn add" onClick={handleNewProduct}>
                        <Plus size={16} /> Nuevo
                    </button>
                </div>
            </div>

            <div className="inventory-search">
                <Search size={18} className="search-icon" />
                <input 
                    type="text" 
                    placeholder="Buscar en inventario..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            {loading ? <p>Cargando inventario...</p> : (
                <div className="inventory-list">
                    {filteredProducts.map(p => (
                        <div key={p.id} className="list-item" onClick={() => handleEditProduct(p)}>
                            <div className="item-left-panel">
                                {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.name} className="product-thumbnail" />
                                ) : (
                                    <div className="product-initial">{p.name.charAt(0).toUpperCase()}</div>
                                )}
                                <div className="item-info">
                                    <strong>{p.name}</strong>
                                    <div className="stock-badge">
                                        Stock: <span>{p.stockActual}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="price-usd">${Number(p.priceBaseUsd).toFixed(2)}</div>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && <p className="empty-state">No hay productos. Añade el primero.</p>}
                </div>
            )}

            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setProductModalOpen(false)}
                product={selectedProduct}
                onSuccess={fetchProducts}
            />

            <TransformModal
                isOpen={isTransformModalOpen}
                onClose={() => setTransformModalOpen(false)}
                products={products}
                onSuccess={fetchProducts}
            />

            <style>{`
                .header-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                .inventory-search {
                    position: relative;
                    margin-bottom: 24px;
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
                .text-btn {
                    padding: 8px 16px;
                    border-radius: var(--radius-sm);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 600;
                    font-size: 14px;
                    color: white;
                    border: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: transform 0.1s, opacity 0.2s;
                }
                .text-btn:active { transform: scale(0.98); }
                .text-btn:hover { opacity: 0.9; }
                
                .text-btn.add { background: var(--success); }
                .text-btn.transform { background: var(--brand); }
                
                .inventory-list {
                    background: white;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .list-item {
                    padding: 16px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .list-item:active { background: #f8f9fa; }
                .list-item:last-child { border-bottom: none; }
                
                .item-left-panel {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .product-thumbnail, .product-initial {
                    width: 48px;
                    height: 48px;
                    border-radius: 8px;
                    flex-shrink: 0;
                }
                .product-thumbnail {
                    object-fit: cover;
                    border: 1px solid var(--border);
                }
                .product-initial {
                    background: #eef6ff;
                    color: var(--brand);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: 700;
                }

                .item-info strong {
                    display: block;
                    font-size: 15px;
                    margin-bottom: 4px;
                    color: var(--text-primary);
                }
                .stock-badge {
                    font-size: 12px;
                    color: var(--text-secondary);
                    background: #f1f3f5;
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-weight: 500;
                }
                .stock-badge span { color: var(--text-primary); font-weight: 700; }
                
                .price-usd { font-weight: 700; color: var(--text-primary); font-size: 15px; }
                
                .empty-state {
                    padding: 24px;
                    text-align: center;
                    color: var(--text-secondary);
                }
            `}</style>
        </div>
    );
};

export default Inventory;


