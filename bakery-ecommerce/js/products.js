/* ============================================================
   products.js — SweetBite Product Data & Rendering
   ============================================================ */

/** Master products array — 18 products */
const products = [
  {id:1,  name:"Mango Delight Scoop",      category:"icecream",   price:180, originalPrice:220, rating:4.5, stock:25, emoji:"🍦", desc:"Fresh mango ice cream scooped to perfection with real alphonso pulp."},
  {id:2,  name:"Dark Chocolate Truffle",   category:"chocolate",  price:350, originalPrice:420, rating:5.0, stock:15, emoji:"🍫", desc:"Rich Belgian chocolate truffles with ganache center."},
  {id:3,  name:"Strawberry Sundae",        category:"icecream",   price:220, originalPrice:260, rating:4.2, stock:20, emoji:"🍓", desc:"Fresh strawberry topping over creamy vanilla ice cream."},
  {id:4,  name:"Classic Tiramisu",         category:"dessert",    price:420, originalPrice:500, rating:4.8, stock:10, emoji:"🍮", desc:"Authentic Italian tiramisu with mascarpone and espresso."},
  {id:5,  name:"Belgian Choco Box",        category:"chocolate",  price:699, originalPrice:799, rating:4.7, stock:8,  emoji:"🎁", desc:"Assorted Belgian chocolates — 16 piece luxury gift box."},
  {id:6,  name:"Vanilla Dream Cake",       category:"cake",       price:560, originalPrice:650, rating:4.3, stock:12, emoji:"🎂", desc:"Soft vanilla sponge layered with whipped cream frosting."},
  {id:7,  name:"Butterscotch Scoop",       category:"icecream",   price:160, originalPrice:200, rating:4.4, stock:30, emoji:"🌟", desc:"Caramel butterscotch ice cream with praline crunch."},
  {id:8,  name:"White Choco Bark",         category:"chocolate",  price:290, originalPrice:340, rating:4.6, stock:18, emoji:"🤍", desc:"White chocolate almond bark with cranberry swirls."},
  {id:9,  name:"Gulab Jamun Box",          category:"dessert",    price:199, originalPrice:249, rating:4.9, stock:22, emoji:"🟤", desc:"Soft khoya gulab jamun soaked in rose-cardamom syrup."},
  {id:10, name:"Blueberry Cheesecake",     category:"cake",       price:650, originalPrice:750, rating:4.7, stock:7,  emoji:"🫐", desc:"New York style baked blueberry cheesecake with cookie crust."},
  {id:11, name:"Kesar Pista Kulfi",        category:"icecream",   price:250, originalPrice:300, rating:4.8, stock:15, emoji:"🟡", desc:"Traditional saffron kulfi loaded with pistachios."},
  {id:12, name:"Ferrero Rocher Box",       category:"chocolate",  price:899, originalPrice:999, rating:5.0, stock:5,  emoji:"✨", desc:"16-piece Ferrero Rocher luxury gift box. Perfect for gifting."},
  {id:13, name:"Red Velvet Cupcake",       category:"cupcake",    price:120, originalPrice:150, rating:4.5, stock:40, emoji:"🧁", desc:"Classic red velvet cupcake with cream cheese frosting."},
  {id:14, name:"Chocolate Chip Cookies",   category:"cookie",     price:149, originalPrice:180, rating:4.3, stock:50, emoji:"🍪", desc:"Chunky chocolate chip cookies baked fresh every morning."},
  {id:15, name:"Rasmalai Box",             category:"dessert",    price:299, originalPrice:349, rating:4.6, stock:16, emoji:"🥛", desc:"Soft rasmalai in saffron-flavoured rabdi, chilled and fresh."},
  {id:16, name:"Oreo Cheesecake",          category:"cake",       price:580, originalPrice:680, rating:4.4, stock:9,  emoji:"⚫", desc:"No-bake Oreo crust cheesecake with chocolate drizzle."},
  {id:17, name:"Coconut Macarons",         category:"cookie",     price:199, originalPrice:240, rating:4.2, stock:35, emoji:"🥥", desc:"French-style coconut macarons with vanilla cream filling."},
  {id:18, name:"Paan Kulfi",               category:"icecream",   price:130, originalPrice:160, rating:4.7, stock:28, emoji:"🌿", desc:"Desi paan-flavored kulfi with betel leaf and meetha supari."}
];

/** Category color map */
const categoryColors = {
  icecream:  '#E3F2FD',
  chocolate: '#EFEBE9',
  dessert:   '#FFF8E1',
  cake:      '#FCE4EC',
  cupcake:   '#F3E5F5',
  cookie:    '#FFF3E0'
};

/** Category display names */
const categoryNames = {
  icecream:  'Ice Cream',
  chocolate: 'Chocolates',
  dessert:   'Desserts',
  cake:      'Cakes',
  cupcake:   'Cupcakes',
  cookie:    'Cookies'
};

/**
 * Initialize products in localStorage if not already set
 */
function initProducts() {
  if (!localStorage.getItem('sweetbite_products')) {
    localStorage.setItem('sweetbite_products', JSON.stringify(products));
  }
}

/**
 * Get all products (from localStorage if available)
 * @returns {Array}
 */
function getAllProducts() {
  return JSON.parse(localStorage.getItem('sweetbite_products')) || products;
}

/**
 * Calculate discount percentage
 * @param {number} price
 * @param {number} originalPrice
 * @returns {number}
 */
function getDiscount(price, originalPrice) {
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * Render a single product card HTML
 * @param {Object} product
 * @returns {string} HTML
 */
function renderProductCard(product) {
  const discount = getDiscount(product.price, product.originalPrice);
  const wishlist = JSON.parse(localStorage.getItem('sweetbite_wishlist')) || [];
  const isWishlisted = wishlist.includes(product.id);
  const catColor = categoryColors[product.category] || '#f5f5f5';

  return `
    <div class="col-md-4 col-sm-6 col-12 mb-4">
      <div class="product-card sweet-card h-100">
        <span class="discount-badge">${discount}% OFF</span>
        <div class="card-body p-3 d-flex flex-column">
          <div class="emoji-circle mb-2" style="background:${catColor}">
            ${product.emoji}
          </div>
          <span class="badge mb-2" style="background:${catColor};color:var(--secondary);font-size:0.72rem;width:fit-content;margin:0 auto">
            ${categoryNames[product.category] || product.category}
          </span>
          <h6 class="fw-bold text-center mb-1" style="font-family:Poppins">${product.name}</h6>
          <p class="text-center mb-2" style="font-size:0.78rem;color:var(--text-muted)">${product.desc}</p>
          <div class="text-center mb-2">${renderStars(product.rating)} <small>(${product.rating})</small></div>
          <div class="text-center mb-3">
            <span class="price-tag">₹${product.price}</span>
            <span class="price-original ms-2">₹${product.originalPrice}</span>
          </div>
          <div class="d-flex gap-2 mt-auto">
            <button class="btn-primary-custom flex-fill btn"
              onclick="addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
              <i class="bi bi-cart-plus me-1"></i>Add to Cart
            </button>
            <button class="btn btn-outline-secondary rounded-circle" style="width:42px;height:42px;padding:0"
              id="wish-${product.id}"
              onclick="toggleWishlist(${product.id}, this)">
              <i class="bi bi-heart${isWishlisted ? '-fill" style="color:#e53935' : ''}"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render featured product card (compact, for homepage)
 * @param {Object} product
 * @returns {string} HTML
 */
function renderFeaturedCard(product) {
  const discount = getDiscount(product.price, product.originalPrice);
  const catColor = categoryColors[product.category] || '#f5f5f5';
  return `
    <div class="col-md-3 col-sm-6 col-12 mb-4">
      <div class="product-card sweet-card h-100">
        <span class="discount-badge">${discount}% OFF</span>
        <div class="card-body p-3 d-flex flex-column">
          <div class="emoji-circle mb-2" style="background:${catColor}">${product.emoji}</div>
          <h6 class="fw-bold text-center mb-1 small">${product.name}</h6>
          <div class="text-center mb-1">${renderStars(product.rating)}</div>
          <div class="text-center mb-2">
            <span class="price-tag">₹${product.price}</span>
            <span class="price-original ms-1">₹${product.originalPrice}</span>
          </div>
          <button class="btn-primary-custom btn w-100 btn-sm mt-auto"
            onclick="addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
            <i class="bi bi-cart-plus me-1"></i>Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initProducts);
