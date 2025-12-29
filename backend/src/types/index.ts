import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User types
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  address?: {
    street?: string;
    ward?: string;
    district?: string;
    city?: string;
    province?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

// Product types
export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: Types.ObjectId;
  tags: string[];
  stock: number;
  featured: boolean;
  averageRating: number;
  totalReviews: number;
  soldCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Category types
export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order types
export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  email?: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  province?: string;
  address?: string;
}

export interface IPaymentProof {
  image: string;
  uploadedAt: Date;
}

export interface IStatusHistory {
  status: string;
  note?: string;
  changedAt: Date;
  changedBy?: Types.ObjectId;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderCode: string;
  user?: Types.ObjectId;
  isGuest: boolean;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentMethod: 'cod' | 'bank_transfer' | 'momo';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentProof?: IPaymentProof;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  total: number;
  couponCode?: string;
  note?: string;
  giftMessage?: string;
  deliveryDate?: Date;
  deliveryTime?: string;
  statusHistory: IStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

// Review types
export interface IReview extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Blog types
export interface IBlog extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  thumbnail?: string;
  images?: string[];
  author: Types.ObjectId;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  featured: boolean;
  views: number;
  publishedAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Newsletter types
export interface INewsletter extends Document {
  _id: Types.ObjectId;
  email: string;
  isActive: boolean;
  subscribedAt: Date;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extended Request with user
export interface AuthRequest extends Request {
  user?: IUser;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
