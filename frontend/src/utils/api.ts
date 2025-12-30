import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/useStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Timeout configuration (in milliseconds)
const DEFAULT_TIMEOUT = 30000; // 30 seconds for normal requests
const UPLOAD_TIMEOUT = 120000; // 2 minutes for file uploads

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error('[API] Request timeout:', error.config?.url);
      return Promise.reject(new Error('Yêu cầu quá thời gian. Vui lòng thử lại.'));
    }

    // Handle network errors
    if (!error.response) {
      console.error('[API] Network error:', error.message);
      return Promise.reject(new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'));
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/auth/password', { oldPassword, newPassword }),
};

// Products API
export const productsAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
  getFeatured: () => api.get('/products/featured'),
  getBestSellers: () => api.get('/products/best-sellers'),
  getNewArrivals: () => api.get('/products/new-arrivals'),
  search: (query: string) => api.get(`/products/search?q=${query}`),
  // Admin
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id: string) => api.get(`/categories/${id}`),
  getProducts: (id: string, params?: any) =>
    api.get(`/categories/${id}/products`, { params }),
  // Admin
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Orders API
export const ordersAPI = {
  getMyOrders: () => api.get('/orders'),  // Backend already filters by user
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  cancel: (id: string) => api.put(`/orders/${id}/cancel`),
  checkPayment: (orderId: string) => api.get(`/orders/check-payment/${orderId}`),
  // Guest checkout (no login required)
  createGuest: (data: any) => api.post('/orders/guest', data),
  lookupGuest: (orderId: string, phone: string) =>
    api.get('/orders/guest/lookup', { params: { orderId, phone } }),
  cancelGuest: (orderId: string, phone: string, reason?: string) =>
    api.put('/orders/guest/cancel', { orderId, phone, reason }),
  // Admin
  getAll: (params?: any) => api.get('/orders', { params }),
  updateStatus: (id: string, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
  updatePaymentStatus: (id: string, paymentStatus: string) =>
    api.put(`/orders/${id}/payment`, { paymentStatus }),
  verifyPayment: (id: string, note?: string) =>
    api.put(`/orders/${id}/verify-payment`, { note }),
};

// Reviews API
export const reviewsAPI = {
  getAll: (params?: any) => api.get('/reviews', { params }),
  getByProduct: (productId: string) => api.get(`/reviews/product/${productId}`),
  create: (data: any) => api.post('/reviews', data),
  update: (id: string, data: any) => api.put(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
  markHelpful: (id: string) => api.put(`/reviews/${id}/helpful`),
};

// Upload API (with extended timeout for file uploads)
export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_TIMEOUT,
    });
  },
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_TIMEOUT,
    });
  },
  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_TIMEOUT,
    });
  },
  // Upload payment proof (public, no auth required on backend)
  uploadPaymentProof: (orderId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('orderId', orderId);
    return api.post('/upload/payment-proof', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_TIMEOUT,
    });
  },
};

// Users API (Admin)
export const usersAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Blogs API
export const blogsAPI = {
  // Public
  getAll: (params?: any) => api.get('/blogs', { params }),
  getFeatured: (limit?: number) => api.get('/blogs/featured', { params: { limit } }),
  getRecent: (limit?: number) => api.get('/blogs/recent', { params: { limit } }),
  getBySlug: (slug: string) => api.get(`/blogs/${slug}`),
  // Admin
  adminGetAll: (params?: any) => api.get('/blogs/admin/all', { params }),
  adminGetById: (id: string) => api.get(`/blogs/admin/${id}`),
  create: (data: any) => api.post('/blogs', data),
  update: (id: string, data: any) => api.put(`/blogs/${id}`, data),
  delete: (id: string) => api.delete(`/blogs/${id}`),
};

// Newsletter API
export const newsletterAPI = {
  subscribe: (email: string) => api.post('/newsletter/subscribe', { email }),
  unsubscribe: (email: string) => api.post('/newsletter/unsubscribe', { email }),
  // Admin
  getSubscribers: (params?: any) => api.get('/newsletter/subscribers', { params }),
  deleteSubscriber: (id: string) => api.delete(`/newsletter/${id}`),
  exportCSV: () => api.get('/newsletter/export', { responseType: 'blob' }),
};

// Coupons API
export const couponsAPI = {
  validate: (code: string, orderAmount: number, phone?: string, cartItems?: any[]) =>
    api.post('/coupons/validate', { code, orderAmount, phone, cartItems }),
  getAvailable: () => api.get('/coupons/available'),
  // Admin
  getAll: (params?: any) => api.get('/coupons', { params }),
  getById: (id: string) => api.get(`/coupons/${id}`),
  create: (data: any) => api.post('/coupons', data),
  update: (id: string, data: any) => api.put(`/coupons/${id}`, data),
  delete: (id: string) => api.delete(`/coupons/${id}`),
  getStats: () => api.get('/coupons/stats/overview'),
};

// Promotions API
export const promotionsAPI = {
  getActive: (type?: string) => api.get('/promotions/active', { params: { type } }),
  getFlashSale: () => api.get('/promotions/flash-sale'),
  getProductPromotion: (productId: string) => api.get(`/promotions/product/${productId}`),
  getBySlug: (slug: string) => api.get(`/promotions/${slug}`),
  // Admin
  getAll: (params?: any) => api.get('/promotions', { params }),
  create: (data: any) => api.post('/promotions', data),
  update: (id: string, data: any) => api.put(`/promotions/${id}`, data),
  delete: (id: string) => api.delete(`/promotions/${id}`),
};

export default api;
