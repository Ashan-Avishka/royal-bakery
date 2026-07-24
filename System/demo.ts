import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { defaultBakeryStore } from './state/BakeryStore';

const PORT = 3000;
const ASSETS_DIR = path.join(__dirname, 'assets');
const LOGO_PATH = path.join(ASSETS_DIR, 'logo.png');
const HERO_BG_PATH = path.join(ASSETS_DIR, 'hero-bg.png');
const CINNAMON_ROLL_PATH = path.join(ASSETS_DIR, 'cinnamon-roll.png');
const RED_VELVET_PATH = path.join(ASSETS_DIR, 'red-velvet-cake.png');
const BLUEBERRY_MUFFIN_PATH = path.join(ASSETS_DIR, 'blueberry-muffin.png');

console.log('====================================================');
console.log('  👑 ROYAL BAKERY FIGMA UI & AUTHENTIC LOGO PORTAL 👑  ');
console.log('====================================================\n');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Royal Bakery — Artisanal Bakery & Confectionery</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --logo-cocoa: #3A1A13;
      --logo-cocoa-dark: #230F0A;
      --logo-golden-caramel: #B67E4B;
      --logo-golden-caramel-hover: #9B6738;
      --logo-honey-gold: #F3C387;
      --logo-honey-light: #FBE3B4;
      --canvas-cream: #FFFBEB;
      --canvas-cream-alt: #FFFDF7;
      --card-white: #FFFFFF;
      --border-warm: #EADCC9;
      --text-dark: #3A1A13;
      --text-muted: #785A52;
      --alert-amber: #D97706;
      --shadow-warm: 0px 8px 24px rgba(58, 26, 19, 0.08);
      --shadow-lg: 0px 16px 40px rgba(58, 26, 19, 0.16);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--canvas-cream);
      color: var(--text-dark);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    h1, h2, h3, h4, .serif {
      font-family: 'Playfair Display', serif;
    }

    /* Top Announcement Bar */
    .announce-bar {
      background: var(--logo-golden-caramel);
      color: #FFFFFF;
      font-size: 0.85rem;
      font-weight: 600;
      text-align: center;
      padding: 0.45rem 1rem;
      letter-spacing: 0.5px;
    }

    /* Header Bar */
    header {
      background: var(--logo-cocoa);
      color: #FFFFFF;
      padding: 0.8rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 25px rgba(58, 26, 19, 0.3);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
      text-decoration: none;
      color: var(--logo-honey-gold);
    }

    .brand-logo-img {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--logo-golden-caramel);
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      background: #FFFFFF;
    }

    .brand-title {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 1px;
      color: var(--logo-honey-gold);
      line-height: 1.1;
    }
    .brand-sub {
      font-size: 0.72rem;
      color: var(--logo-honey-light);
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-weight: 600;
    }

    nav { display: flex; gap: 0.6rem; align-items: center; }

    .nav-btn {
      background: transparent;
      border: 1px solid transparent;
      color: #EADCC9;
      padding: 0.55rem 1.1rem;
      border-radius: 9999px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .nav-btn:hover, .nav-btn.active {
      background: var(--logo-golden-caramel);
      color: #FFFFFF;
      border-color: var(--logo-golden-caramel);
    }

    .cart-badge {
      background: #FFFFFF;
      color: var(--logo-cocoa);
      font-size: 0.75rem;
      font-weight: 800;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .user-badge {
      background: var(--logo-honey-light);
      color: var(--logo-cocoa);
      padding: 0.45rem 1rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 700;
      border: 1px solid var(--logo-honey-gold);
    }

    /* Main Container */
    main {
      flex: 1;
      padding: 2.5rem 2.5rem;
      max-width: 1280px;
      margin: 0 auto;
      width: 100%;
    }

    /* Hero Banner Component with Rich Artisanal Background Image */
    .hero-card {
      background: linear-gradient(135deg, rgba(35, 15, 10, 0.92) 0%, rgba(58, 26, 19, 0.84) 100%), url('/hero-bg.png');
      background-size: cover;
      background-position: center;
      color: #FFFFFF;
      border-radius: 24px;
      padding: 3.8rem 3.2rem;
      margin-bottom: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 3rem;
      box-shadow: var(--shadow-lg);
      border: 1.5px solid rgba(243, 195, 135, 0.35);
      position: relative;
      overflow: hidden;
    }

    .hero-content { flex: 1; z-index: 2; }

    .hero-tag {
      display: inline-block;
      background: rgba(243, 195, 135, 0.2);
      backdrop-filter: blur(8px);
      color: var(--logo-honey-gold);
      padding: 0.45rem 1.1rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 700;
      border: 1px solid rgba(243, 195, 135, 0.4);
      margin-bottom: 1.2rem;
      letter-spacing: 1px;
    }

    .hero-card h1 {
      font-size: 3.2rem;
      color: var(--logo-honey-gold);
      margin-bottom: 1rem;
      line-height: 1.15;
      text-shadow: 0 4px 15px rgba(0,0,0,0.6);
    }

    .hero-card p {
      font-size: 1.18rem;
      color: #FBE3B4;
      max-width: 620px;
      line-height: 1.65;
      margin-bottom: 2.2rem;
      text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }

    .hero-logo-img {
      width: 230px;
      height: 230px;
      border-radius: 50%;
      object-fit: cover;
      border: 5px solid var(--logo-golden-caramel);
      box-shadow: 0 14px 45px rgba(0, 0, 0, 0.6);
      background: #FFFFFF;
      z-index: 2;
    }

    /* Category Pill Selector Bar */
    .category-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 2rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }

    .cat-pill {
      background: var(--card-white);
      color: var(--text-dark);
      border: 1.5px solid var(--border-warm);
      padding: 0.65rem 1.5rem;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .cat-pill.active, .cat-pill:hover {
      background: var(--logo-golden-caramel);
      color: #FFFFFF;
      border-color: var(--logo-golden-caramel);
    }

    /* Product Grid & Cards */
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;
    }

    .product-card {
      background: var(--card-white);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--border-warm);
      box-shadow: var(--shadow-warm);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      display: flex;
      flex-direction: column;
    }

    .product-card:hover {
      transform: translateY(-6px);
      box-shadow: var(--shadow-lg);
    }

    .product-img-wrapper {
      position: relative;
      width: 100%;
      height: 220px;
      overflow: hidden;
    }

    .product-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    .product-card:hover .product-img {
      transform: scale(1.05);
    }

    .dietary-tag {
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: rgba(58, 26, 19, 0.85);
      backdrop-filter: blur(4px);
      color: var(--logo-honey-gold);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .product-body {
      padding: 1.4rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .rating-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: #D97706;
      font-weight: 700;
      margin-bottom: 0.4rem;
    }

    .product-body h3 {
      font-size: 1.3rem;
      color: var(--logo-cocoa);
      margin-bottom: 0.4rem;
    }

    .price {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--logo-golden-caramel);
      margin-bottom: 0.6rem;
      font-family: 'Playfair Display', serif;
    }

    .stock-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      margin-bottom: 0.9rem;
      width: fit-content;
    }

    .stock-in { background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; }
    .stock-low { background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }

    /* Buttons */
    .btn {
      background: var(--logo-golden-caramel);
      color: #FFFFFF;
      border: none;
      padding: 0.8rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      width: 100%;
      margin-top: auto;
      transition: background 0.2s ease, transform 0.1s ease;
      box-shadow: 0 4px 14px rgba(182, 126, 75, 0.28);
    }

    .btn:hover {
      background: var(--logo-golden-caramel-hover);
    }

    .btn:active { transform: scale(0.98); }

    .btn-secondary {
      background: var(--logo-honey-gold);
      color: var(--logo-cocoa);
    }

    .btn-secondary:hover {
      background: var(--logo-honey-light);
    }

    /* Cards & Section Boxes */
    .card {
      background: var(--card-white);
      border: 1px solid var(--border-warm);
      border-radius: 20px;
      padding: 2.2rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-warm);
    }

    /* About Us Special Styles */
    .about-hero {
      background: linear-gradient(135deg, rgba(35, 15, 10, 0.94) 0%, rgba(58, 26, 19, 0.88) 100%), url('/hero-bg.png');
      background-size: cover;
      background-position: center;
      color: #FFFFFF;
      border-radius: 24px;
      padding: 4rem 3rem;
      margin-bottom: 2.5rem;
      text-align: center;
      box-shadow: var(--shadow-lg);
      border: 1.5px solid rgba(243, 195, 135, 0.35);
    }

    .about-hero h1 {
      font-size: 3.4rem;
      color: var(--logo-honey-gold);
      margin-bottom: 1rem;
    }

    .about-hero p {
      font-size: 1.25rem;
      color: #FBE3B4;
      max-width: 750px;
      margin: 0 auto 2rem auto;
      line-height: 1.6;
    }

    .pillar-card {
      background: var(--canvas-cream);
      border: 1px solid var(--border-warm);
      border-radius: 16px;
      padding: 1.8rem;
      text-align: center;
      transition: transform 0.2s ease;
    }

    .pillar-card:hover {
      transform: translateY(-5px);
    }

    .pillar-icon {
      font-size: 2.5rem;
      margin-bottom: 0.8rem;
    }

    /* Form Inputs */
    .form-group { margin-bottom: 1.3rem; }
    .form-group label {
      display: block;
      margin-bottom: 0.45rem;
      color: var(--text-dark);
      font-weight: 700;
      font-size: 0.9rem;
    }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%;
      padding: 0.8rem 1.1rem;
      border-radius: 10px;
      border: 1.5px solid var(--border-warm);
      background: var(--canvas-cream-alt);
      color: var(--text-dark);
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s ease;
    }
    .form-group input:focus, .form-group textarea:focus {
      border-color: var(--logo-golden-caramel);
      background: #FFFFFF;
    }

    /* Stat Box */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.8rem;
    }

    .stat-box {
      background: var(--canvas-cream);
      padding: 1.6rem;
      border-radius: 14px;
      border: 1px solid var(--border-warm);
      text-align: center;
    }

    .stat-val {
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--logo-golden-caramel);
      font-family: 'Playfair Display', serif;
    }

    .stat-lbl {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-top: 0.3rem;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: var(--logo-cocoa);
      color: var(--logo-honey-gold);
      border: 1.5px solid var(--logo-golden-caramel);
      padding: 1.1rem 1.8rem;
      border-radius: 14px;
      font-weight: 700;
      box-shadow: var(--shadow-lg);
      display: none;
      z-index: 1000;
    }

    footer {
      background: var(--logo-cocoa);
      color: #EADCC9;
      text-align: center;
      padding: 2rem;
      font-size: 0.92rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
  </style>
</head>
<body>
  <div class="announce-bar">✨ Royal Bakery · Handcrafted Fresh Daily with Single-Origin Ceylon Ingredients · Since 1999 ✨</div>
  
  <header>
    <a href="#" class="brand" onclick="dispatchAction({ type: 'NAVIGATE', payload: { screen: 'home' } })">
      <img src="/logo.png" alt="Royal Bakery Logo" class="brand-logo-img" />
      <div>
        <div class="brand-title">ROYAL BAKERY</div>
        <div class="brand-sub">WARM BREAD, WARM MOMENTS</div>
      </div>
    </a>
    <nav id="navbar"></nav>
    <div id="userBadge"></div>
  </header>

  <main id="appContent">Loading Royal Bakery Portal...</main>

  <footer>
    👑 <b>Royal Bakery Colombo</b> · No. 12, Flower Road, Colombo 07 · Tel: +94 11 234 5678 · Open Daily 7 AM – 8 PM
  </footer>

  <div id="toast" class="toast"></div>

  <script>
    let currentState = null;

    async function fetchState() {
      const res = await fetch('/api/state');
      currentState = await res.json();
      render();
    }

    async function dispatchAction(action) {
      const res = await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      currentState = await res.json();
      if (currentState.notifications && currentState.notifications.length > 0) {
        showToast(currentState.notifications[0].message);
      }
      render();
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 3200);
    }

    function renderNav() {
      const nav = document.getElementById('navbar');
      const screens = [
        { id: 'home', label: '🏪 Storefront' },
        { id: 'about', label: '📜 About Us' },
        { id: 'cart', label: '🛒 Basket', badge: currentState.cart.items.length },
        { id: 'checkout', label: '💳 Checkout' },
        { id: 'tracking', label: '🚚 Live Tracking' },
      ];

      if (currentState.auth.isAuthenticated) {
        if (currentState.auth.role === 'customer') {
          screens.push({ id: 'dashboard', label: '👤 User Dashboard' });
        } else {
          screens.push({ id: 'admin-dashboard', label: '⚙️ Admin Dashboard' });
        }
      } else {
        screens.push({ id: 'signin', label: '🔑 Sign In' });
        screens.push({ id: 'signup', label: '📝 Sign Up' });
      }

      nav.innerHTML = screens.map(s => \`
        <button class="nav-btn \${currentState.navigation.activeScreen === s.id ? 'active' : ''}"
          onclick="dispatchAction({ type: 'NAVIGATE', payload: { screen: '\${s.id}' } })">
          \${s.label}
          \${s.badge !== undefined && s.badge > 0 ? '<span class="cart-badge">' + s.badge + '</span>' : ''}
        </button>
      \`).join('');

      const badge = document.getElementById('userBadge');
      if (currentState.auth.isAuthenticated) {
        badge.innerHTML = \`
          <span class="user-badge">👤 \${currentState.auth.currentUser.name} (\${currentState.auth.currentUser.role.toUpperCase()})</span>
          <button class="nav-btn" onclick="dispatchAction({ type: 'SIGN_OUT' })" style="margin-left:8px;background:rgba(255,255,255,0.15);">Sign Out</button>
        \`;
      } else {
        badge.innerHTML = '<span style="color:#EADCC9;font-size:0.85rem;font-weight:600;">Guest Mode</span>';
      }
    }

    function renderScreen() {
      const app = document.getElementById('appContent');
      const screen = currentState.navigation.activeScreen;

      if (screen === 'home') {
        const categories = ['All', 'Cakes', 'Pastries', 'Breads', 'Cookies', 'Custom Sweets'];
        const activeCat = currentState.catalog.activeCategory || 'All';

        app.innerHTML = \`
          <div class="hero-card">
            <div class="hero-content">
              <span class="hero-tag">AUTHENTIC ROYAL BAKERY · SINCE 1999</span>
              <h1 class="serif">Handcrafted Artisanal Delights, Baked Fresh Daily</h1>
              <p>Experience Colombo's finest cakes, single-origin chocolate ganache pastries, and 36-hour fermented sourdough loaves.</p>
              <div style="display:flex;gap:1.2rem;">
                <button class="btn btn-secondary" style="width:auto;padding:0.85rem 2rem;" onclick="dispatchAction({ type: 'NAVIGATE', payload: { screen: 'signin' } })">Sign In / Register</button>
                <button class="btn" style="width:auto;padding:0.85rem 2rem;" onclick="dispatchAction({ type: 'NAVIGATE', payload: { screen: 'about' } })">About Us</button>
              </div>
            </div>
            <img src="/logo.png" alt="Royal Bakery Authentic Logo" class="hero-logo-img" />
          </div>

          <div class="category-bar">
            \${categories.map(c => \`
              <button class="cat-pill \${activeCat === c ? 'active' : ''}"
                onclick="dispatchAction({ type: 'SET_CATEGORY_FILTER', payload: '\${c}' })">
                \${c}
              </button>
            \`).join('')}
          </div>

          <div class="card">
            <h2 class="serif" style="margin-bottom:1.4rem;color:var(--logo-cocoa);">🍰 Signature Oven Fresh Collection</h2>
            <div class="grid-3">
              \${currentState.catalog.filteredProducts.map(p => \`
                <div class="product-card">
                  <div class="product-img-wrapper">
                    <img src="\${p.img}" class="product-img">
                    \${p.dietaryTags && p.dietaryTags.length ? '<span class="dietary-tag">' + p.dietaryTags[0] + '</span>' : ''}
                  </div>
                  <div class="product-body">
                    <div class="rating-row">★ \${p.rating || '4.9'} (\${p.reviewCount || 100}+ reviews)</div>
                    <h3>\${p.name}</h3>
                    <div class="price">\${p.price}</div>
                    <span class="stock-badge \${p.stock === 'in-stock' ? 'stock-in' : 'stock-low'}">\${p.stock === 'in-stock' ? 'In Stock' : 'Low Stock'}</span>
                    <p style="font-size:0.88rem;color:var(--text-muted);margin-bottom:1.2rem;line-height:1.5;">\${p.description}</p>
                    <button class="btn" onclick="dispatchAction({ type: 'ADD_TO_CART', payload: { product: JSON.parse('\${JSON.stringify(p).replace(/'/g, "&apos;")}') } })">Add to Basket</button>
                  </div>
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      } else if (screen === 'about') {
        app.innerHTML = \`
          <div class="about-hero">
            <img src="/logo.png" alt="Royal Bakery Logo" style="width:140px;height:140px;border-radius:50%;margin-bottom:1.5rem;border:4px solid var(--logo-golden-caramel);box-shadow:0 8px 30px rgba(0,0,0,0.5);" />
            <h1 class="serif">Warm Bread, Warm Moments</h1>
            <p>Since 1999, Royal Bakery has been Colombo's home for authentic master baking, pairing Ceylon spices with time-honored European confectionery traditions.</p>
          </div>

          <div class="card" style="border-top:5px solid var(--logo-golden-caramel);">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;align-items:center;">
              <div>
                <span style="color:var(--logo-golden-caramel);font-weight:700;letter-spacing:1px;text-transform:uppercase;font-size:0.85rem;">Our Heritage</span>
                <h2 class="serif" style="color:var(--logo-cocoa);font-size:2.2rem;margin:0.5rem 0 1rem 0;">A Quarter Century of Baking Excellence</h2>
                <p style="color:var(--text-muted);line-height:1.7;margin-bottom:1rem;">
                  Founded in Flower Road, Colombo 07, Royal Bakery started with a simple promise: to bake every single item with pure, natural Sri Lankan ingredients, uncompromised passion, and single-origin Ceylon cocoa.
                </p>
                <p style="color:var(--text-muted);line-height:1.7;">
                  Over the past 25 years, our family of master bakers has combined traditional 36-hour sourdough fermentation with delicate French pastry techniques to craft unforgettable moments for birthdays, weddings, and daily morning coffee.
                </p>
              </div>
              <div style="border-radius:16px;overflow:hidden;box-shadow:var(--shadow-lg);border:1px solid var(--border-warm);">
                <img src="/hero-bg.png" alt="Artisanal Bakery Kitchen" style="width:100%;height:320px;object-fit:cover;" />
              </div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:1.5rem;margin-bottom:2.5rem;">
            <div class="pillar-card">
              <div class="pillar-icon">🌾</div>
              <h3 class="serif" style="color:var(--logo-cocoa);margin-bottom:0.4rem;">Ceylon Spices</h3>
              <p style="font-size:0.88rem;color:var(--text-muted);">Real Ceylon cinnamon, cardamom, and mountain vanilla harvested locally in Sri Lanka.</p>
            </div>
            <div class="pillar-card">
              <div class="pillar-icon">🍞</div>
              <h3 class="serif" style="color:var(--logo-cocoa);margin-bottom:0.4rem;">36-Hr Fermentation</h3>
              <p style="font-size:0.88rem;color:var(--text-muted);">Naturally fermented sourdough loaves baked daily in brick deck ovens for perfect crust.</p>
            </div>
            <div class="pillar-card">
              <div class="pillar-icon">🍫</div>
              <h3 class="serif" style="color:var(--logo-cocoa);margin-bottom:0.4rem;">Single-Origin Cocoa</h3>
              <p style="font-size:0.88rem;color:var(--text-muted);">Rich chocolate ganaches and truffle creams made with 70% dark single-origin chocolate.</p>
            </div>
            <div class="pillar-card">
              <div class="pillar-icon">👨‍🍳</div>
              <h3 class="serif" style="color:var(--logo-cocoa);margin-bottom:0.4rem;">Master Bakers</h3>
              <p style="font-size:0.88rem;color:var(--text-muted);">Crafted with passion by seasoned bakers dedicated to perfection in every bite.</p>
            </div>
          </div>

          <div class="card" style="background:var(--logo-cocoa);color:#FFFFFF;text-align:center;border-color:var(--logo-golden-caramel);">
            <div class="stat-grid" style="margin-bottom:0;">
              <div class="stat-box" style="background:rgba(255,255,255,0.06);border-color:rgba(243,195,135,0.2);"><div class="stat-val" style="color:var(--logo-honey-gold);">25+</div><div class="stat-lbl" style="color:#EADCC9;">Years of Passion</div></div>
              <div class="stat-box" style="background:rgba(255,255,255,0.06);border-color:rgba(243,195,135,0.2);"><div class="stat-val" style="color:var(--logo-honey-gold);">50,000+</div><div class="stat-lbl" style="color:#EADCC9;">Cakes Baked</div></div>
              <div class="stat-box" style="background:rgba(255,255,255,0.06);border-color:rgba(243,195,135,0.2);"><div class="stat-val" style="color:var(--logo-honey-gold);">100%</div><div class="stat-lbl" style="color:#EADCC9;">Sri Lankan Owned</div></div>
            </div>
          </div>
        \`;
      } else if (screen === 'signin') {
        app.innerHTML = \`
          <div class="card" style="max-width:480px;margin:2rem auto;border-top:5px solid var(--logo-golden-caramel);text-align:center;">
            <img src="/logo.png" alt="Royal Bakery Logo" style="width:100px;height:100px;border-radius:50%;margin-bottom:1rem;border:3.5px solid var(--logo-golden-caramel);box-shadow:0 4px 15px rgba(0,0,0,0.15);" />
            <h2 class="serif" style="color:var(--logo-cocoa);margin-bottom:0.4rem;">🔑 Sign In to Royal Bakery</h2>
            <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.9rem;text-align:left;">
              Enter your credentials to access your customer dashboard, order history, and saved address preferences.
            </p>
            <div style="background:var(--canvas-cream);padding:1rem 1.2rem;border-radius:12px;margin-bottom:1.5rem;border:1px solid var(--border-warm);font-size:0.88rem;text-align:left;">
              <b>💡 Test Login Credentials:</b><br/>
              • <b>Customer:</b> <code>amara@example.com</code> / <code>Password123!</code><br/>
              • <b>Admin:</b> <code>admin</code> / <code>admin123</code>
            </div>
            <div class="form-group" style="text-align:left;">
              <label>Email Address or Username</label>
              <input id="loginEmail" value="amara@example.com" />
            </div>
            <div class="form-group" style="text-align:left;">
              <label>Password</label>
              <input id="loginPass" type="password" value="Password123!" />
            </div>
            <button class="btn" onclick="
              dispatchAction({
                type: 'SIGN_IN',
                payload: {
                  emailOrUsername: document.getElementById('loginEmail').value,
                  password: document.getElementById('loginPass').value
                }
              })">Sign In to Dashboard</button>
          </div>
        \`;
      } else if (screen === 'signup') {
        app.innerHTML = \`
          <div class="card" style="max-width:550px;margin:2rem auto;border-top:5px solid var(--logo-golden-caramel);text-align:center;">
            <img src="/logo.png" alt="Royal Bakery Logo" style="width:100px;height:100px;border-radius:50%;margin-bottom:1rem;border:3.5px solid var(--logo-golden-caramel);box-shadow:0 4px 15px rgba(0,0,0,0.15);" />
            <h2 class="serif" style="color:var(--logo-cocoa);margin-bottom:0.4rem;">📝 Create Customer Account</h2>
            <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.9rem;text-align:left;">Register with Royal Bakery to save addresses, track live orders, and pre-fill checkout contact details.</p>
            <div class="form-group" style="text-align:left;"><label>Full Name</label><input id="regName" value="Sunil Shantha" /></div>
            <div class="form-group" style="text-align:left;"><label>Email Address</label><input id="regEmail" value="sunil@example.com" /></div>
            <div class="form-group" style="text-align:left;"><label>Phone Number</label><input id="regPhone" value="+94 77 111 2222" /></div>
            <div class="form-group" style="text-align:left;"><label>Delivery Address</label><input id="regAddr" value="No. 88, Galle Road, Colombo 03" /></div>
            <div class="form-group" style="text-align:left;"><label>Password (min 6 characters)</label><input id="regPass" type="password" value="Sunil123!" /></div>
            <div class="form-group" style="text-align:left;"><label>Confirm Password</label><input id="regConfirmPass" type="password" value="Sunil123!" /></div>
            <button class="btn" onclick="
              dispatchAction({
                type: 'SIGN_UP',
                payload: {
                  name: document.getElementById('regName').value,
                  email: document.getElementById('regEmail').value,
                  phone: document.getElementById('regPhone').value,
                  address: document.getElementById('regAddr').value,
                  password: document.getElementById('regPass').value,
                  confirmPassword: document.getElementById('regConfirmPass').value
                }
              })">Create Account & Sign In</button>
          </div>
        \`;
      } else if (screen === 'dashboard') {
        const u = currentState.auth.userDashboard;
        app.innerHTML = \`
          <div class="card" style="border-top:5px solid var(--logo-golden-caramel);">
            <div style="display:flex;align-items:center;gap:1.8rem;margin-bottom:1.8rem;">
              <img src="/logo.png" alt="Royal Bakery Logo" style="width:80px;height:80px;border-radius:50%;border:3px solid var(--logo-golden-caramel);" />
              <div>
                <h2 class="serif" style="color:var(--logo-cocoa);">👤 Customer Profile & Dashboard</h2>
                <p style="color:var(--text-muted);">Welcome back, <b>\${u.profile.name}</b> (\${u.profile.email})</p>
              </div>
            </div>
            
            <div class="stat-grid">
              <div class="stat-box"><div class="stat-val">\${u.orderHistory.length}</div><div class="stat-lbl">Orders Placed</div></div>
              <div class="stat-box"><div class="stat-val">\${u.favoriteCount}</div><div class="stat-lbl">Saved Wishlist</div></div>
              <div class="stat-box"><div class="stat-val">\${u.profile.phone || 'N/A'}</div><div class="stat-lbl">Contact Phone</div></div>
            </div>

            <h3 class="serif" style="margin-top:1.8rem;margin-bottom:1rem;color:var(--logo-cocoa);">📦 Order History</h3>
            \${u.orderHistory.map(o => \`
              <div style="background:var(--canvas-cream);padding:1.4rem;border-radius:14px;margin-bottom:1rem;border:1px solid var(--border-warm);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <b style="font-size:1.15rem;color:var(--logo-cocoa);">Order #\${o.orderId}</b>
                    <div style="font-size:0.88rem;color:var(--text-muted);margin-top:0.2rem;">Placed: \${o.placedAt} | Fulfillment: \${o.fulfillmentMethod.toUpperCase()}</div>
                  </div>
                  <div style="text-align:right;">
                    <div class="price">LKR \${o.summary.total.toLocaleString()}</div>
                    <span class="stock-badge stock-in" style="text-transform:uppercase;">\${o.status}</span>
                  </div>
                </div>
              </div>
            \`).join('')}
          </div>
        \`;
      } else if (screen === 'admin-dashboard' || screen === 'admin') {
        const a = currentState.auth.adminDashboard || currentState.admin;
        app.innerHTML = \`
          <div class="card" style="border-top:5px solid var(--logo-cocoa);">
            <div style="display:flex;align-items:center;gap:1.8rem;margin-bottom:1.8rem;">
              <img src="/logo.png" alt="Royal Bakery Logo" style="width:80px;height:80px;border-radius:50%;border:3px solid var(--logo-golden-caramel);" />
              <div>
                <h2 class="serif" style="color:var(--logo-cocoa);">⚙️ Royal Bakery Admin Portal</h2>
                <p style="color:var(--text-muted);">Store Operations, Inventory & Sales Analytics</p>
              </div>
            </div>
            
            <div class="stat-grid">
              <div class="stat-box"><div class="stat-val">LKR \${a.analytics.totalRevenue.toLocaleString()}</div><div class="stat-lbl">Total Sales Revenue</div></div>
              <div class="stat-box"><div class="stat-val">\${a.analytics.totalOrdersCount}</div><div class="stat-lbl">Total Orders Processed</div></div>
              <div class="stat-box"><div class="stat-val">\${a.analytics.topCategory}</div><div class="stat-lbl">Top Category</div></div>
            </div>
          </div>
        \`;
      } else if (screen === 'cart') {
        app.innerHTML = \`
          <div class="card">
            <h2 class="serif" style="color:var(--logo-cocoa);margin-bottom:1.2rem;">🛒 Shopping Basket Summary</h2>
            \${currentState.cart.items.length === 0 ? '<p style="color:var(--text-muted);">Your basket is currently empty.</p>' : \`
              \${currentState.cart.items.map(i => \`
                <div style="display:flex;justify-content:space-between;align-items:center;padding:1.2rem 0;border-bottom:1px solid var(--border-warm);">
                  <div>
                    <b style="font-size:1.1rem;color:var(--logo-cocoa);">\${i.name}</b>
                    <div style="font-size:0.88rem;color:var(--text-muted);">Qty: \${i.qty} | Portion: \${i.size}</div>
                  </div>
                  <div class="price">LKR \${(i.price * i.qty).toLocaleString()}</div>
                </div>
              \`).join('')}
              <div style="margin-top:1.8rem;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:1.2rem;font-weight:700;">Basket Subtotal:</span>
                <span class="price" style="font-size:1.5rem;">LKR \${currentState.cart.summary.subtotal.toLocaleString()}</span>
              </div>
              <button class="btn" style="margin-top:1.8rem;" onclick="dispatchAction({ type: 'NAVIGATE', payload: { screen: 'checkout' } })">Proceed to Checkout</button>
            \`}
          </div>
        \`;
      } else if (screen === 'checkout') {
        const c = currentState.checkout.contact;
        app.innerHTML = \`
          <div class="card" style="max-width:680px;margin:0 auto;border-top:5px solid var(--logo-golden-caramel);">
            <h2 class="serif" style="color:var(--logo-cocoa);margin-bottom:0.5rem;">💳 Order Checkout</h2>
            \${currentState.auth.isAuthenticated ? '<p style="color:#047857;background:#ECFDF5;padding:0.7rem 1.1rem;border-radius:10px;margin-bottom:1.8rem;font-size:0.9rem;border:1px solid #A7F3D0;">✓ Contact details auto-filled from signed-in customer profile</p>' : '<p style="color:var(--text-muted);margin-bottom:1.8rem;font-size:0.9rem;">Guest Checkout (Sign in to auto-fill details)</p>'}
            <div class="form-group"><label>First Name</label><input value="\${c.firstName || ''}" /></div>
            <div class="form-group"><label>Last Name</label><input value="\${c.lastName || ''}" /></div>
            <div class="form-group"><label>Email Address</label><input value="\${c.email || ''}" /></div>
            <div class="form-group"><label>Delivery Address</label><input value="\${c.address || ''}" /></div>
            <button class="btn" style="margin-top:1.2rem;" onclick="dispatchAction({ type: 'SUBMIT_CHECKOUT' })">Place Order & Confirm</button>
          </div>
        \`;
      } else if (screen === 'tracking') {
        const o = currentState.tracking.currentOrder;
        app.innerHTML = \`
          <div class="card" style="border-top:5px solid var(--logo-golden-caramel);">
            <h2 class="serif" style="color:var(--logo-cocoa);margin-bottom:0.5rem;">🚚 Live Order Tracking</h2>
            \${!o ? '<p style="color:var(--text-muted);">No active order available to track.</p>' : \`
              <div style="background:var(--canvas-cream);padding:1.4rem;border-radius:14px;margin-bottom:1.8rem;border:1px solid var(--border-warm);">
                <b style="font-size:1.15rem;color:var(--logo-cocoa);">Order #\${o.orderId}</b>
                <div style="color:var(--logo-golden-caramel);font-weight:700;margin-top:0.3rem;">Status: \${o.statusHeadline}</div>
              </div>
              <div>
                \${o.trackingSteps.map(s => \`
                  <div style="padding:0.85rem 1.2rem;margin-bottom:0.6rem;border-radius:10px;background:\${s.done ? '#ECFDF5' : s.active ? '#FFFBEB' : 'transparent'};border:1px solid \${s.done ? '#A7F3D0' : s.active ? '#FDE68A' : 'transparent'};">
                    <span style="font-size:1.1rem;margin-right:10px;">\${s.done ? '✓' : s.active ? '⏳' : '⚪'}</span>
                    <b style="color:var(--logo-cocoa);">\${s.label}</b>
                    <span style="font-size:0.88rem;color:var(--text-muted);margin-left:10px;">\${s.sub}</span>
                  </div>
                \`).join('')}
              </div>
            \`}
          </div>
        \`;
      }
    }

    function render() {
      renderNav();
      renderScreen();
    }

    fetchState();
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
  } else if (req.url === '/logo.png') {
    if (fs.existsSync(LOGO_PATH)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(fs.readFileSync(LOGO_PATH));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Logo Not Found');
    }
  } else if (req.url === '/hero-bg.png') {
    if (fs.existsSync(HERO_BG_PATH)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(fs.readFileSync(HERO_BG_PATH));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Background Image Not Found');
    }
  } else if (req.url === '/cinnamon-roll.png') {
    if (fs.existsSync(CINNAMON_ROLL_PATH)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(fs.readFileSync(CINNAMON_ROLL_PATH));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Image Not Found');
    }
  } else if (req.url === '/red-velvet-cake.png') {
    if (fs.existsSync(RED_VELVET_PATH)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(fs.readFileSync(RED_VELVET_PATH));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Image Not Found');
    }
  } else if (req.url === '/blueberry-muffin.png') {
    if (fs.existsSync(BLUEBERRY_MUFFIN_PATH)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(fs.readFileSync(BLUEBERRY_MUFFIN_PATH));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Image Not Found');
    }
  } else if (req.url === '/api/state' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(defaultBakeryStore.getState()));
  } else if (req.url === '/api/dispatch' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const action = JSON.parse(body);
        defaultBakeryStore.dispatch(action);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(defaultBakeryStore.getState()));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid action payload' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`✅ Royal Bakery Server with Local Assets running at: http://localhost:${PORT}`);
  console.log('👉 Open your browser to http://localhost:3000 to view the updated UI!\n');
});
