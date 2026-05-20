import { CartItem, StoreConfig, AdminAuth } from './types';

const CART_KEY = 'table-order-cart';
const CONFIG_KEY = 'table-order-config';
const ADMIN_KEY = 'table-order-admin';

export const storage = {
  getCart(): CartItem[] {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  },
  setCart(items: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  },
  clearCart() {
    localStorage.removeItem(CART_KEY);
  },

  getConfig(): StoreConfig | null {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setConfig(config: StoreConfig) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  getAdmin(): AdminAuth | null {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return null;
    const auth: AdminAuth = JSON.parse(raw);
    if (new Date(auth.expires_at) < new Date()) {
      localStorage.removeItem(ADMIN_KEY);
      return null;
    }
    return auth;
  },
  setAdmin(auth: AdminAuth) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(auth));
  },
  clearAdmin() {
    localStorage.removeItem(ADMIN_KEY);
  },
};
