import { Product } from '../types/catalog';
import { CartItem } from '../types/cart';
import { TrackingStep, Order } from '../types/order';
import { PromoCode } from '../types/cart';
import { ScreenConfig } from '../types/navigation';

export const SYSTEM_SCREENS: ScreenConfig[] = [
  { id: 'home', label: 'Storefront' },
  { id: 'about', label: 'About Us' },
  { id: 'product', label: 'Product Detail' },
  { id: 'cart', label: 'Cart Drawer' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'tracking', label: 'Order Tracking' },
  { id: 'contact', label: 'Contact' },
  { id: 'signin', label: 'Sign In' },
  { id: 'signup', label: 'Sign Up' },
  { id: 'profile', label: 'User Profile' },
  { id: 'dashboard', label: 'User Dashboard' },
  { id: 'admin', label: 'Admin Portal' },
  { id: 'admin-dashboard', label: 'Admin Dashboard' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Chocolate Truffle Cake',
    price: 'LKR 4,200',
    numericPrice: 4200,
    category: 'Cakes',
    stock: 'in-stock',
    img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=480&h=480&fit=crop&auto=format',
    description: 'Decadent layers of rich chocolate ganache and velvety truffle cream, crafted with single-origin Sri Lankan cocoa. Each cake is hand-assembled and refrigerated to order.',
    rating: 4.9,
    reviewCount: 128,
    availableSizes: ['500g', '1kg', '2kg'],
    dietaryTags: ['Eggless', 'Vegetarian'],
    thumbnails: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120&h=120&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=120&h=120&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=120&h=120&fit=crop&auto=format',
    ],
    mainImages: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700&h=700&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=700&h=700&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=700&h=700&fit=crop&auto=format',
    ],
    reviews: [
      { id: 101, author: 'Amara P.', rating: 5, comment: 'Absolutely divine chocolate cake! The ganache is melt-in-mouth quality.', date: 'Jul 18, 2024' },
      { id: 102, author: 'Kasun K.', rating: 5, comment: 'Best birthday cake we ever ordered in Colombo. 10/10 recommend.', date: 'Jul 12, 2024' },
    ],
  },
  {
    id: 2,
    name: 'Almond Croissant',
    price: 'LKR 380',
    numericPrice: 380,
    category: 'Pastries',
    stock: 'in-stock',
    img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=480&h=480&fit=crop&auto=format',
    description: 'Flaky buttery croissant filled with almond frangipane and toasted almonds.',
    rating: 4.8,
    reviewCount: 94,
    availableSizes: ['1 pc', '2 pcs', 'Box of 6'],
    dietaryTags: ['Vegetarian'],
    reviews: [
      { id: 201, author: 'Dinithi S.', rating: 5, comment: 'Crispy outer layers and warm rich filling!', date: 'Jul 15, 2024' },
    ],
  },
  {
    id: 3,
    name: 'Artisan Sourdough',
    price: 'LKR 650',
    numericPrice: 650,
    category: 'Breads',
    stock: 'in-stock',
    img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=480&h=480&fit=crop&auto=format',
    description: 'Naturally fermented 36-hour sourdough loaf with a crispy crust and chewy interior.',
    rating: 4.7,
    reviewCount: 65,
    dietaryTags: ['Gluten-Free', 'Eggless', 'Vegetarian'],
    reviews: [
      { id: 301, author: 'Ruwan M.', rating: 5, comment: 'True sourdough flavor! Perfectly toasted with butter.', date: 'Jul 10, 2024' },
    ],
  },
  {
    id: 4,
    name: 'Butter Shortbread',
    price: 'LKR 480',
    numericPrice: 480,
    category: 'Cookies',
    stock: 'low-stock',
    img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=480&h=480&fit=crop&auto=format',
    description: 'Traditional melt-in-your-mouth shortbread made with pure New Zealand butter.',
    rating: 4.6,
    reviewCount: 42,
    dietaryTags: ['Eggless', 'Nut-Free', 'Vegetarian'],
  },
  {
    id: 5,
    name: 'Red Velvet Cake',
    price: 'LKR 3,800',
    numericPrice: 3800,
    category: 'Cakes',
    stock: 'in-stock',
    img: '/red-velvet-cake.png',
    description: 'Moist red velvet sponge layers paired with velvety cream cheese frosting.',
    rating: 4.9,
    reviewCount: 110,
    dietaryTags: ['Nut-Free', 'Vegetarian'],
  },
  {
    id: 6,
    name: 'Cinnamon Roll',
    price: 'LKR 320',
    numericPrice: 320,
    category: 'Pastries',
    stock: 'in-stock',
    img: '/cinnamon-roll.png',
    description: 'Warm fluffy roll layered with Ceylon cinnamon and cream cheese glaze.',
    rating: 4.8,
    reviewCount: 88,
    dietaryTags: ['Nut-Free', 'Vegetarian'],
  },
  {
    id: 7,
    name: 'Blueberry Muffin',
    price: 'LKR 280',
    numericPrice: 280,
    category: 'Pastries',
    stock: 'low-stock',
    img: '/blueberry-muffin.png',
    description: 'Soft bakery muffin bursting with wild blueberries and lemon zest.',
    rating: 4.5,
    reviewCount: 53,
    dietaryTags: ['Eggless', 'Nut-Free', 'Vegetarian'],
  },
  {
    id: 8,
    name: 'Custom Wedding Cake',
    price: 'LKR 18,000',
    numericPrice: 18000,
    category: 'Custom Sweets',
    stock: 'in-stock',
    img: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=480&h=480&fit=crop&auto=format',
    description: 'Multi-tiered bespoke wedding cake designed to your exact flavor and aesthetic preferences.',
    rating: 5.0,
    reviewCount: 39,
    dietaryTags: ['Eggless', 'Vegetarian'],
  },
];

export const INITIAL_CART_ITEMS: CartItem[] = [
  { id: 1, productId: 1, name: 'Chocolate Truffle Cake', size: '1kg', price: 4200, qty: 1, img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=160&h=160&fit=crop&auto=format' },
  { id: 2, productId: 2, name: 'Almond Croissant', size: '2 pcs', price: 380, qty: 2, img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=160&h=160&fit=crop&auto=format' },
  { id: 3, productId: 4, name: 'Butter Shortbread', size: 'Box of 12', price: 480, qty: 1, img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=160&h=160&fit=crop&auto=format' },
];

export const INITIAL_TRACKING_STEPS: TrackingStep[] = [
  { id: 1, label: 'Order Received', sub: 'Jul 21, 2:15 PM', done: true },
  { id: 2, label: 'Baking in Oven', sub: 'Jul 21, 2:45 PM', done: true },
  { id: 3, label: 'Ready for Pickup', sub: 'Estimated 4:00 PM', done: false, active: true },
  { id: 4, label: 'Out for Delivery', sub: 'Estimated 4:30 PM', done: false },
  { id: 5, label: 'Delivered', sub: 'Estimated 5:30 PM', done: false },
];

export const PROMO_CODES: Record<string, PromoCode> = {
  ROYAL10: { code: 'ROYAL10', discountPercentage: 10, description: '10% off on all orders' },
  WELCOME15: { code: 'WELCOME15', discountPercentage: 15, description: '15% off first order' },
};

export const INITIAL_ORDER: Order = {
  orderId: 'RB-2024-0847',
  placedAt: 'Monday, 21 July 2024 at 2:15 PM',
  estimatedDeliveryTime: '5:00 PM',
  status: 'baking',
  statusHeadline: 'Baking in Progress',
  fulfillmentMethod: 'delivery',
  contact: {
    firstName: 'Amara',
    lastName: 'Perera',
    email: 'amara@example.com',
    phone: '+94 77 123 4567',
    address: 'No. 42, Temple Road, Colombo 03',
    deliveryTimeSlot: '4:00 PM – 6:00 PM',
  },
  items: INITIAL_CART_ITEMS,
  summary: {
    subtotal: 5440,
    deliveryFee: 350,
    tax: 435,
    discount: 0,
    total: 6225,
    itemCount: 4,
  },
  trackingSteps: INITIAL_TRACKING_STEPS,
  emailNotificationSent: true,
};

export const BAKERY_CONTACT_INFO = {
  address: 'No. 12, Flower Road, Colombo 07\nOpen Daily · 7 AM – 8 PM',
  phone: ['+94 11 234 5678', '+94 77 890 1234'],
  email: ['hello@royalbakery.lk', 'orders@royalbakery.lk'],
};
