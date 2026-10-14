const APP_CONFIG = {
  location: "Ngepoh Kidul, Balepanjang",
  openingHours: "09:00-16:00 WIB setiap hari",
  instagramUrl: "https://instagram.com/esgabinkekinian",
  tiktokUrl: "https://tiktok.com/@esgabinkekinian",
  whatsappNumber: "628979199244"
};

const menu = [
  { id: "gabin-mangga", category: "gabin", name: "Es Gabin Mangga", flavor: "Mangga", price: 5000, emoji: "🥭", art: "mango", description: "Biskuit renyah dengan es krim mangga." },
  { id: "gabin-matcha", category: "gabin", name: "Es Gabin Matcha", flavor: "Matcha", price: 5000, emoji: "🍵", art: "matcha", description: "Matcha lembut diapit gabin renyah." },
  { id: "gabin-coklat", category: "gabin", name: "Es Gabin Coklat", flavor: "Coklat", price: 5000, emoji: "🍫", art: "chocolate", description: "Coklat creamy, manisnya pas banget." },
  { id: "gabin-stroberi", category: "gabin", name: "Es Gabin Stroberi", flavor: "Stroberi", price: 5000, emoji: "🍓", art: "strawberry", description: "Segarnya stroberi di dalam gabin." },
  { id: "gabin-vanilla", category: "gabin", name: "Es Gabin Vanilla", flavor: "Vanilla", price: 5000, emoji: "🍦", art: "vanilla", description: "Vanilla klasik favorit semua usia." },
  { id: "es-krim-cemil", category: "cemil", name: "Es Krim Cemil", price: 3000, emoji: "🍨", art: "cemil", description: "Es krim cup dengan topping pilihanmu.", sizes: [{ id: "kecil", label: "Kecil", price: 3000 }, { id: "besar", label: "Besar", price: 5000 }], toppings: ["Meses warna-warni", "Choco chips", "Saus coklat"] }
];

const formatRupiah = (value) => `Rp${new Intl.NumberFormat("id-ID").format(value)}`;
const productGrid = document.querySelector("#product-grid");
const cartItems = document.querySelector("#cart-items");
const cartTotal = document.querySelector("#cart-total");
const cartCount = document.querySelector("#cart-count");
const checkoutButton = document.querySelector("#whatsapp-button");
const drawer = document.querySelector("#cart-drawer");
const backdrop = document.querySelector("#drawer-backdrop");
const cart = new Map();
const selectedSizes = new Map([["es-krim-cemil", "kecil"]]);
const selectedToppings = new Map([["es-krim-cemil", "Meses warna-warni"]]);
let activeCategory = "semua";
let toastTimer;
let deferredInstallPrompt = null;

function cardQuantity(item, size, topping) {
  const key = cartKey(item, size, topping);
  return cart.get(key)?.quantity || 0;
}

function cartKey(item, size = "", topping = "") {
  return [item.id, size, topping].join("|");
}

function renderProduct(item) {
  const flavorClass = item.art || "gabin";
  const variantUI = item.category === "cemil"
    ? `<label class="topping-label" for="topping-${item.id}">Pilih topping</label>
       <select class="topping-select" id="topping-${item.id}" data-topping="${item.id}">${item.toppings.map((topping) => `<option ${selectedToppings.get(item.id) === topping ? "selected" : ""}>${topping}</option>`).join("")}</select>
       <div class="size-options" aria-label="Pilih ukuran">${item.sizes.map((size) => `<button class="size-option ${selectedSizes.get(item.id) === size.id ? "active" : ""}" type="button" data-size="${item.id}" data-size-id="${size.id}" aria-pressed="${selectedSizes.get(item.id) === size.id}">${size.label} · ${formatRupiah(size.price)}</button>`).join("")}</div>`
    : `<div class="product-price">Promo ${formatRupiah(item.price)} <span> / pcs</span></div>`;
  const size = item.category === "cemil" ? item.sizes.find((option) => option.id === selectedSizes.get(item.id)) : null;
  const topping = item.category === "cemil" ? selectedToppings.get(item.id) : "";
  const quantity = cardQuantity(item, size?.id, topping);
  return `<article class="product-card" data-product="${item.id}">
    <div class="product-art ${flavorClass}" aria-label="Ilustrasi ${item.name}" role="img"><span>${item.emoji}</span></div>
    <h3>${item.name}</h3><p class="product-description">${item.description}</p>${variantUI}
    ${item.category === "cemil" ? `<div class="product-price">${formatRupiah(size.price)} <span> / cup ${size.label.toLowerCase()}</span></div>` : ""}
    <div class="card-controls"><span class="field-label">Jumlah</span><div class="qty-control"><button class="qty-button" type="button" data-quantity="-1" data-item="${item.id}" aria-label="Kurangi ${item.name}">−</button><span class="qty-value" data-card-quantity="${item.id}">${quantity}</span><button class="qty-button add" type="button" data-quantity="1" data-item="${item.id}" aria-label="Tambah ${item.name}">+</button></div></div>
  </article>`;
}

function renderMenu() {
  const visibleMenu = menu.filter((item) => activeCategory === "semua" || item.category === activeCategory);
  productGrid.innerHTML = visibleMenu.map(renderProduct).join("");
}

function updateFulfillment() {
  const isDelivery = document.querySelector('input[name="fulfillment"]:checked').value === "antar";
  document.querySelector("#address-label").hidden = !isDelivery;
  const address = document.querySelector("#customer-address");
  address.hidden = !isDelivery;
  address.required = isDelivery;
}

function renderCart() {
  const entries = [...cart.values()];
  if (!entries.length) {
    cartItems.innerHTML = `<div class="empty-cart"><span>🧺</span><p>Keranjangmu masih kosong.</p><small>Yuk pilih camilan favoritmu!</small></div>`;
  } else {
    cartItems.innerHTML = entries.map((entry) => `<div class="cart-row">
      <span class="cart-row-emoji" aria-hidden="true">${entry.item.emoji}</span>
      <div class="cart-row-info"><strong>${entry.item.name}</strong><small>${entry.detail || ""}</small></div>
      <span class="cart-row-price">${formatRupiah(entry.price * entry.quantity)}</span>
      <div class="cart-qty"><button type="button" data-cart-quantity="-1" data-key="${entry.key}" aria-label="Kurangi ${entry.item.name}">−</button><span>${entry.quantity}</span><button type="button" data-cart-quantity="1" data-key="${entry.key}" aria-label="Tambah ${entry.item.name}">+</button></div>
    </div>`).join("");
  }
  const total = entries.reduce((sum, entry) => sum + entry.price * entry.quantity, 0);
  const count = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  cartTotal.textContent = formatRupiah(total);
  cartCount.textContent = count;
  checkoutButton.disabled = !count;
}

function changeItemQuantity(itemId, direction) {
  const item = menu.find((product) => product.id === itemId);
  const size = item.category === "cemil" ? item.sizes.find((option) => option.id === selectedSizes.get(item.id)) : null;
  const topping = item.category === "cemil" ? selectedToppings.get(item.id) : "";
  const key = cartKey(item, size?.id, topping);
  const current = cart.get(key);
  const quantity = (current?.quantity || 0) + direction;
  if (quantity <= 0) cart.delete(key);
  else cart.set(key, { key, item, quantity, size: size?.id || "", price: size?.price || item.price, detail: size ? `${size.label} · ${topping}` : item.flavor });
  renderMenu();
  renderCart();
  if (direction > 0) showToast(`${item.name} ditambahkan 💗`);
}

function changeCartQuantity(key, direction) {
  const entry = cart.get(key);
  if (!entry) return;
  entry.quantity += direction;
  if (entry.quantity <= 0) cart.delete(key);
  renderMenu();
  renderCart();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function openCart() {
  backdrop.hidden = false;
  requestAnimationFrame(() => backdrop.classList.add("visible"));
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  drawer.inert = false;
  document.body.style.overflow = "hidden";
  document.querySelector("#close-cart").focus();
}

function closeCart() {
  backdrop.classList.remove("visible");
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  drawer.inert = true;
  document.body.style.overflow = "";
  window.setTimeout(() => { backdrop.hidden = true; }, 220);
  document.querySelector("#open-cart").focus();
}

function submitOrder(event) {
  event.preventDefault();
  if (!cart.size) return;
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = String(data.get("name")).trim();
  const fulfillment = data.get("fulfillment") === "antar" ? "Antar" : "Ambil di Tempat";
  const address = String(data.get("address") || "").trim();
  const notes = String(data.get("notes") || "").trim();
  const lines = [...cart.values()].map((entry) => `• ${entry.item.name}${entry.detail ? ` (${entry.detail})` : ""} x${entry.quantity} — ${formatRupiah(entry.price * entry.quantity)}`);
  const total = [...cart.values()].reduce((sum, entry) => sum + entry.price * entry.quantity, 0);
  const message = ["Halo Es Gabin Kekinian! Saya mau pesan:", "", ...lines, "", `Total: ${formatRupiah(total)}`, `Nama: ${name}`, `Pesanan: ${fulfillment}`, ...(fulfillment === "Antar" ? [`Alamat: ${address}`] : []), ...(notes ? [`Catatan: ${notes}`] : []), "Terima kasih!"];
  window.open(`https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent(message.join("\n"))}`, "_blank", "noopener,noreferrer");
}

document.querySelectorAll(".category-tab").forEach((tab) => tab.addEventListener("click", () => {
  activeCategory = tab.dataset.category;
  document.querySelectorAll(".category-tab").forEach((button) => {
    const isActive = button === tab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  renderMenu();
}));

productGrid.addEventListener("click", (event) => {
  const sizeButton = event.target.closest("[data-size]");
  if (sizeButton) {
    selectedSizes.set(sizeButton.dataset.size, sizeButton.dataset.sizeId);
    renderMenu();
    return;
  }
  const quantityButton = event.target.closest("[data-quantity]");
  if (quantityButton) changeItemQuantity(quantityButton.dataset.item, Number(quantityButton.dataset.quantity));
});

productGrid.addEventListener("change", (event) => {
  const select = event.target.closest("[data-topping]");
  if (select) {
    selectedToppings.set(select.dataset.topping, select.value);
    renderMenu();
  }
});
cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-quantity]");
  if (button) changeCartQuantity(button.dataset.key, Number(button.dataset.cartQuantity));
});
document.querySelector("#open-cart").addEventListener("click", openCart);
document.querySelector("#close-cart").addEventListener("click", closeCart);
backdrop.addEventListener("click", closeCart);
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && drawer.classList.contains("open")) closeCart(); });
document.querySelectorAll('input[name="fulfillment"]').forEach((input) => input.addEventListener("change", updateFulfillment));
document.querySelector("#checkout-form").addEventListener("submit", submitOrder);
document.querySelector("#location-text").textContent = APP_CONFIG.location;
document.querySelector("#hours-text").textContent = APP_CONFIG.openingHours;
document.querySelector("#instagram-link").href = APP_CONFIG.instagramUrl;
document.querySelector("#tiktok-link").href = APP_CONFIG.tiktokUrl;
document.querySelector("#current-year").textContent = new Date().getFullYear();
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.querySelector("#install-button").textContent = "Install";
});
document.querySelector("#install-button").addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    showToast("Pilih ‘Tambahkan ke layar utama’ dari menu browser 📲");
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
});
window.addEventListener("appinstalled", () => showToast("Aplikasi berhasil dipasang 💔"));

renderMenu();
renderCart();
updateFulfillment();
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => showToast("Mode offline belum tersedia.")));
}
