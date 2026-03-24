import { create } from 'zustand';

interface CartItem {
    id: string;
    name: string;
    priceBaseUsd: number;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (product: any) => void;
    removeItem: (productId: string) => void;
    clearCart: () => void;
    getTotalUsd: () => number;
    getTotalVes: (rate: number) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],

    addItem: (product) => {
        const { items } = get();
        const existing = items.find((i) => i.id === product.id);

        if (existing) {
            if (existing.quantity >= product.stockActual) return;
            set({
                items: items.map((i) =>
                    i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
                ),
            });
        } else {
            if (product.stockActual <= 0) return;
            set({
                items: [...items, {
                    id: product.id,
                    name: product.name,
                    priceBaseUsd: Number(product.priceBaseUsd),
                    quantity: 1
                }],
            });
        }
    },

    removeItem: (productId) => {
        const { items } = get();
        const existing = items.find((i) => i.id === productId);
        if (existing && existing.quantity > 1) {
            set({
                items: items.map((i) =>
                    i.id === productId ? { ...i, quantity: i.quantity - 1 } : i
                ),
            });
        } else {
            set({ items: items.filter((i) => i.id !== productId) });
        }
    },

    clearCart: () => set({ items: [] }),

    getTotalUsd: () => {
        return get().items.reduce((acc, item) => acc + item.priceBaseUsd * item.quantity, 0);
    },

    getTotalVes: (rate: number) => {
        return get().getTotalUsd() * rate;
    },
}));
