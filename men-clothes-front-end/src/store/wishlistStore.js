import { create } from 'zustand';
import api from '../lib/api';

const useWishlistStore = create((set, get) => ({
  items: [],
  loading: false,

  fetchWishlist: async () => {
    set({ loading: true });

    try {
      const res = await api.get('/api/wishlist');
      set({ items: res.data });
    } catch {
      set({ items: [] });
    } finally {
      set({ loading: false });
    }
  },

  isWishlisted: (productId) => {
    return get().items.some((item) => item.id === productId);
  },

  addToWishlist: async (productId) => {
    await api.post(`/api/wishlist/${productId}`);
    await get().fetchWishlist();
  },

  removeFromWishlist: async (productId) => {
    await api.delete(`/api/wishlist/${productId}`);
    set({
      items: get().items.filter((item) => item.id !== productId),
    });
  },

  toggleWishlist: async (productId) => {
    const exists = get().isWishlisted(productId);

    if (exists) {
      await get().removeFromWishlist(productId);
    } else {
      await get().addToWishlist(productId);
    }
  },
}));

export default useWishlistStore;