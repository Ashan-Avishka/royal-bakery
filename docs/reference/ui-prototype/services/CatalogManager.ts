import { Product, ProductCategory, ProductFilter } from '../types/catalog';
import { INITIAL_PRODUCTS } from '../data/mockData';

export class CatalogManager {
  private products: Product[];

  constructor(initialProducts: Product[] = INITIAL_PRODUCTS) {
    this.products = [...initialProducts];
  }

  public getAllProducts(): Product[] {
    return [...this.products];
  }

  public getProductsByCategory(category: ProductCategory): Product[] {
    if (category === 'All') {
      return this.getAllProducts();
    }
    return this.products.filter(p => p.category === category);
  }

  public searchProducts(query: string): Product[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAllProducts();
    return this.products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }

  public getProductById(id: number): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  public filterProducts(filter: ProductFilter): Product[] {
    let result = this.products;

    if (filter.category && filter.category !== 'All') {
      result = result.filter(p => p.category === filter.category);
    }

    if (filter.dietaryTag) {
      result = result.filter(
        p => p.dietaryTags && p.dietaryTags.includes(filter.dietaryTag!)
      );
    }

    if (filter.favoriteIds) {
      result = result.filter(p => filter.favoriteIds!.includes(p.id));
    }

    if (filter.searchQuery && filter.searchQuery.trim() !== '') {
      const q = filter.searchQuery.trim().toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (filter.inStockOnly) {
      result = result.filter(p => p.stock === 'in-stock');
    }

    return result;
  }

  public addReview(productId: number, author: string, rating: number, comment: string): boolean {
    const product = this.getProductById(productId);
    if (product) {
      if (!product.reviews) product.reviews = [];
      const newReview = {
        id: Date.now(),
        author,
        rating,
        comment,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      product.reviews.unshift(newReview);
      product.reviewCount = (product.reviewCount || 0) + 1;

      // Recalculate average rating
      const totalStars = product.reviews.reduce((sum, r) => sum + r.rating, 0);
      product.rating = parseFloat((totalStars / product.reviews.length).toFixed(1));
      return true;
    }
    return false;
  }
}
