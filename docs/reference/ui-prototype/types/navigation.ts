export type Screen =
  | 'home'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'tracking'
  | 'contact'
  | 'about'
  | 'admin'
  | 'signin'
  | 'signup'
  | 'profile'
  | 'dashboard'
  | 'admin-dashboard';

export interface ScreenConfig {
  id: Screen;
  label: string;
}

export interface NavigationState {
  activeScreen: Screen;
  screens: ScreenConfig[];
  selectedProductId?: number;
}
