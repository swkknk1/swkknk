import { InventoryItem, OrderItem, StoreSettings } from '../types';
import { INITIAL_ITEMS, INITIAL_SETTINGS } from '../data/storeData';

const STORAGE_KEYS = {
  ITEMS: 'inventory_store_items',
  ORDERS: 'inventory_store_orders',
  SETTINGS: 'inventory_store_settings',
};

export const DEFAULT_INITIAL_ITEMS: InventoryItem[] = [];

const getAdminHeaders = () => {
  const token = sessionStorage.getItem('admin_session_token') || localStorage.getItem('admin_session_token') || '';
  return {
    'Content-Type': 'application/json',
    'x-admin-token': token,
  };
};

export const api = {
  // Items
  async getItems(): Promise<InventoryItem[]> {
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data)) {
            localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(data));
            return data;
          }
        }
      }
    } catch {
      // Network failure / static host fallback
    }
    const local = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (local !== null) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return INITIAL_ITEMS || [];
  },

  async createItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(item),
      });

      if (res.ok) {
        const newItem = await res.json();
        const current = await this.getItems();
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify([newItem, ...current.filter((i) => i.id !== newItem.id)]));
        return newItem;
      }

      if (res.status === 401 || res.status === 403) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || '创建商品失败，请确认店主管理登录状态');
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('权限') || e.message.includes('登录'))) {
        throw e;
      }
    }

    // Static mode creation (Netlify fallback)
    const newItem: InventoryItem = {
      id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: item.title || '新商品',
      category: item.category || '全部存货',
      price: Number(item.price) || 0,
      originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
      condition: item.condition || '99新',
      stock: item.stock !== undefined ? Number(item.stock) : 1,
      status: item.status || 'available',
      description: item.description || '',
      imageUrl: item.imageUrl || (item.images && item.images[0]) || '',
      images: item.images && item.images.length > 0 ? item.images : (item.imageUrl ? [item.imageUrl] : []),
      tags: item.tags || [],
      location: item.location || '自提或在学校领取',
      createdAt: item.createdAt || new Date().toISOString(),
    };
    const current = await this.getItems();
    const updated = [newItem, ...current.filter((i) => i.id !== newItem.id)];
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(updated));
    return newItem;
  },

  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updated = await res.json();
        const current = await this.getItems();
        const mapped = current.map((i) => (i.id === id ? updated : i));
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(mapped));
        return updated;
      }

      if (res.status === 401 || res.status === 403) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || '更新商品失败，请确认店主管理登录状态');
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('权限') || e.message.includes('登录'))) {
        throw e;
      }
    }

    // Static mode update (Netlify fallback)
    const current = await this.getItems();
    const index = current.findIndex((i) => i.id === id);
    if (index !== -1) {
      const updated = { ...current[index], ...updates };
      current[index] = updated;
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(current));
      return updated;
    }
    throw new Error('未找到该商品');
  },

  async deleteItem(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });

      if (res.ok) {
        const current = await this.getItems();
        const filtered = current.filter((i) => i.id !== id);
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(filtered));
        return true;
      }

      if (res.status === 401 || res.status === 403) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || '删除商品失败，请确认店主管理登录状态');
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('权限') || e.message.includes('登录'))) {
        throw e;
      }
    }

    // Static mode delete (Netlify fallback)
    const current = await this.getItems();
    const filtered = current.filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(filtered));
    return true;
  },

  // Orders
  async getOrders(): Promise<OrderItem[]> {
    if (!this.hasAdminSession()) {
      return [];
    }
    try {
      const res = await fetch('/api/orders', {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data));
          return data;
        }
      }
    } catch {}
    const local = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return [];
  },

  async createOrder(orderData: Partial<OrderItem> & { autoReserve?: boolean }): Promise<{ success: boolean; order: OrderItem; message: string }> {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          return await res.json();
        }
      }

      if (res.status === 409) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '选购的商品库存不足或刚刚已被其他买家预订，请刷新页面查看最新货品');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('库存不足')) {
        throw err;
      }
      // In static deployment or if server is unreachable, fall through cleanly
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder: OrderItem = {
      id: orderId,
      createdAt: new Date().toISOString(),
      status: 'pending',
      buyerName: orderData.buyerName || '买家',
      buyerEmail: orderData.buyerEmail || '',
      buyerContact: orderData.buyerContact || '',
      deliveryMethod: orderData.deliveryMethod || '在学校领取',
      shippingAddress: orderData.shippingAddress || '',
      note: orderData.note || '',
      items: orderData.items || [],
      totalAmount: orderData.totalAmount || 0,
      sellerEmail: orderData.sellerEmail || 'shiwokakanaka@gmail.com',
      emailPushed: true,
    };

    return {
      success: true,
      order: newOrder,
      message: `意向清单已生成，请通过邮件或微信联系店主`,
    };
  },

  async updateOrderStatus(id: string, status: OrderItem['status']): Promise<OrderItem> {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: getAdminHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || '更新订单状态失败');
    }
    const updated = await res.json();
    const orders = await this.getOrders();
    const mapped = orders.map((o) => (o.id === id ? updated : o));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(mapped));
    return updated;
  },

  // Settings
  async getSettings(): Promise<StoreSettings> {
    const defaults: StoreSettings = { ...INITIAL_SETTINGS };

    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
          return { ...defaults, ...data };
        }
      }
    } catch {}

    const local = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (local) {
      try {
        return { ...defaults, ...JSON.parse(local) };
      } catch {}
    }
    return defaults;
  },

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(settings),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || '保存店铺设置失败，请确认店主管理登录状态');
    }

    const data = await res.json();
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
    return data;
  },

  async testEmail(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || '请求服务器失败' };
    }
  },

  async resetData(): Promise<void> {
    try {
      await fetch('/api/data/reset', {
        method: 'POST',
        headers: getAdminHeaders(),
      });
    } catch {}
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  },

  async checkAdminSession(): Promise<boolean> {
    const token = sessionStorage.getItem('admin_session_token') || localStorage.getItem('admin_session_token');
    if (!token) return false;

    if (token.startsWith('adm_static_')) {
      return true;
    }

    try {
      const res = await fetch('/api/admin/check-session', {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          return !!data.authenticated;
        }
      }
    } catch {}
    return !!token;
  },

  async adminLogin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          if (data.token) {
            sessionStorage.setItem('admin_session_token', data.token);
            localStorage.setItem('admin_session_token', data.token);
          }
          return { success: true };
        }
        return { success: false, error: data.error || '账号或管理密码错误，请核对后重试' };
      }
      if (res.status === 401 || res.status === 429) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || '账号或管理密码错误，请核对后重试' };
      }
    } catch {
      // Offline or static Netlify host
    }

    // Static mode authentication (verifies against store settings)
    const settings = await this.getSettings();
    const expectedEmail = (settings.sellerEmail || 'shiwokakanaka@gmail.com').toLowerCase().trim();
    const expectedPassword = settings.adminPassword || 'admin888';

    if (
      email.toLowerCase().trim() === expectedEmail &&
      password === expectedPassword
    ) {
      const staticToken = `adm_static_${Date.now()}`;
      sessionStorage.setItem('admin_session_token', staticToken);
      localStorage.setItem('admin_session_token', staticToken);
      return { success: true };
    }

    return { success: false, error: '管理员账号或管理密码错误，请核对后重试' };
  },

  async adminLogout(): Promise<void> {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: getAdminHeaders(),
      });
    } catch {}
    sessionStorage.removeItem('admin_session_token');
    localStorage.removeItem('admin_session_token');
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
  },

  hasAdminSession(): boolean {
    return !!(sessionStorage.getItem('admin_session_token') || localStorage.getItem('admin_session_token'));
  },

  async persistToSource(items?: InventoryItem[], settings?: StoreSettings): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/persist-to-source', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ items, settings }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || '永久固化保存失败，请检查店主登录状态');
    }

    const data = await res.json();
    if (items) localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    if (settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return data;
  },
};
