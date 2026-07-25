export type ProductCategory = 'All' | 'Cakes' | 'Pastries' | 'Breads' | 'Cookies' | 'Custom Sweets';

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export type ProductSize = '500g' | '1kg' | '2kg' | string;

export type DietaryTag = 'Eggless' | 'Gluten-Free' | 'Nut-Free' | 'Vegetarian';

export interface ProductReview {
  id: number;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: number;
  name: string;
  price: string;
  numericPrice: number;
  category: ProductCategory;
  stock: StockStatus;
  img: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  availableSizes?: ProductSize[];
  thumbnails?: string[];
  mainImages?: string[];
  dietaryTags?: DietaryTag[];
  reviews?: ProductReview[];
}

export interface ProductFilter {
  category?: ProductCategory;
  searchQuery?: string;
  inStockOnly?: boolean;
  dietaryTag?: DietaryTag;
  favoriteIds?: number[];
}

export interface ProductCustomization {
  selectedSize?: ProductSize;
  inscription?: string;
  candles?: number;
  deliveryDate?: string;
  quantity: number;
}
