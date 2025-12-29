import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, CartItem, Product } from '@/types'
import { resetChatSession } from '@/utils/socket'

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  // Aliases for compatibility
  itemCount: number;
  total: number;
  addToCart: (product: Product, quantity?: number) => void;
  addItem: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

interface FavoritesState {
  items: Product[];
  addToFavorites: (product: Product) => void;
  removeFromFavorites: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
}

interface AppState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

// Auth Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => {
        // Reset chat session on logout
        resetChatSession();
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
    }),
    {
      name: 'auth-storage',
    }
  )
)

// Cart Store
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      // Aliases
      get itemCount() { return get().totalItems; },
      get total() { return get().totalPrice; },

      addToCart: (product, quantity = 1) => {
        const items = get().items;
        const existingItem = items.find(item => item.product._id === product._id);

        if (existingItem) {
          const updatedItems = items.map(item =>
            item.product._id === product._id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalPrice = updatedItems.reduce((sum, item) =>
            sum + (item.product.salePrice || item.product.price) * item.quantity, 0
          );
          set({ items: updatedItems, totalItems, totalPrice });
        } else {
          const updatedItems = [...items, { product, quantity }];
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalPrice = updatedItems.reduce((sum, item) =>
            sum + (item.product.salePrice || item.product.price) * item.quantity, 0
          );
          set({ items: updatedItems, totalItems, totalPrice });
        }
      },

      removeFromCart: (productId) => {
        const items = get().items.filter(item => item.product._id !== productId);
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = items.reduce((sum, item) =>
          sum + (item.product.salePrice || item.product.price) * item.quantity, 0
        );
        set({ items, totalItems, totalPrice });
      },

      // Aliases
      addItem: (product, quantity = 1) => get().addToCart(product, quantity),
      removeItem: (productId) => get().removeFromCart(productId),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        const items = get().items.map(item =>
          item.product._id === productId ? { ...item, quantity } : item
        );
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = items.reduce((sum, item) =>
          sum + (item.product.salePrice || item.product.price) * item.quantity, 0
        );
        set({ items, totalItems, totalPrice });
      },

      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),
    }),
    {
      name: 'cart-storage',
    }
  )
)

// Favorites Store
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],

      addToFavorites: (product) => {
        const items = get().items;
        const exists = items.some(item => item._id === product._id);
        if (!exists) {
          set({ items: [...items, product] });
        }
      },

      removeFromFavorites: (productId) => {
        set({ items: get().items.filter(item => item._id !== productId) });
      },

      isFavorite: (productId) => {
        return get().items.some(item => item._id === productId);
      },

      clearFavorites: () => set({ items: [] }),
    }),
    {
      name: 'favorites-storage',
    }
  )
)

// App Store
export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}))
