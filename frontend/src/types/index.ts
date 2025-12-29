// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

// Product types
export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string[];
  category: Category;
  tags?: string[];
  stock: number;
  soldCount?: number;
  rating?: number;
  reviewCount?: number;
  averageRating?: number;
  totalReviews?: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Category types
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image: string;
  itemCount?: number;
}

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

// Order types
export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  orderCode?: string; // Short order code like DH00001
  user: User;
  isGuest?: boolean;
  items: OrderItem[];
  subtotal: number;
  shippingCost?: number;
  tax?: number;
  total: number;
  discount?: number;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveryDate?: string;
  deliveryTime?: string;
  giftMessage?: string;
  note?: string;
  statusHistory?: Array<{
    status: string;
    date: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

// Address types
export interface Address {
  fullName: string;
  phone: string;
  street?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  // Vietnamese address format
  ward?: string;        // Phường/Xã
  district?: string;    // Quận/Huyện
  province?: string;    // Tỉnh/Thành phố
}

// Review types
export interface Review {
  _id: string;
  user: User;
  product: Product;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  helpfulCount?: number;
  isVerifiedPurchase?: boolean;
  isApproved?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Coupon types
export interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  usageLimitPerUser: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isValid?: boolean;
  createdAt?: string;
}

// Promotion types
export interface Promotion {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  type: 'flash_sale' | 'seasonal' | 'holiday' | 'clearance' | 'bundle';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  products: PromotionProduct[];
  bannerImage?: string;
  bannerImageMobile?: string;
  primaryColor?: string;
  secondaryColor?: string;
  showCountdown: boolean;
  isFeatured: boolean;
  isCurrentlyActive?: boolean;
  timeRemaining?: {
    status: 'upcoming' | 'active' | 'ended';
    seconds: number;
  };
}

export interface PromotionProduct {
  product: Product;
  customDiscount?: number;
  stockLimit?: number;
  soldCount: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
