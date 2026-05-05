import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, variant, quantity) => {
        const existing = get().items.find(i => i.variantId === variant.id);
        if (existing) {
          set({
            items: get().items.map(i =>
              i.variantId === variant.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({
            items: [...get().items, {
              productId: product.id,
              variantId: variant.id,
              name: product.name,
              size: variant.size,
              color: variant.color,
              price: product.price,
              quantity,
              image: product.images?.[0] || '',
            }],
          });
        }
      },
      removeItem: (variantId) =>
        set({ items: get().items.filter(i => i.variantId !== variantId) }),
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) get().removeItem(variantId);
        else set({ items: get().items.map(i => i.variantId === variantId ? { ...i, quantity } : i) });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'cart-storage-guest' } // always start as guest
  )
);

export default useCartStore;