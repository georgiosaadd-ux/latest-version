export interface EBook {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  price: number;
  originalPrice?: number;
  description: string;
  badges: string[];
  takeaways: string[];
  cover: string;
  pages: number;
  audioMinutes: number;
}

export interface Bundle {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  savings: number;
  ebookIds: string[];
  ebooks: EBook[];
}

export interface CartItem {
  type: 'ebook' | 'bundle';
  id: string;
  item: EBook | Bundle;
  quantity: number;
  metadata?: {
    subtotal?: number;
    discount?: number;
    freeCount?: number;
    pricingMode?: 'bundle_pre_discounted';
    originalItems?: Array<{ title: string; price: number }>;
  };
}

export interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  marketingConsent: boolean;
}

export interface UpsellRecommendation {
  primary: EBook;
  companion: EBook;
  message: string;
  show: boolean;
}