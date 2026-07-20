const loader = document.querySelector(".loader");
const tabs = document.querySelectorAll(".tab");
const cards = document.querySelectorAll(".product-card");
const searchInput = document.getElementById("searchInput");

let cart = [];

// Loader
window.addEventListener("load", () => {
  setTimeout(() => {
    if (loader) loader.classList.add("hide");

    const floatingButtons = document.querySelector(".floating-buttons");
    if (floatingButtons) {
      floatingButtons.classList.add("show");
    }

    cards.forEach((card, index) => {
      setTimeout(() => {
        if (card.getBoundingClientRect().top < window.innerHeight) {
          card.classList.add("show");
        }
      }, index * 50);
    });
  }, 800);
});

// Intersection Observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
}, {
  threshold: 0.15,
  rootMargin: "0px 0px -50px 0px"
});

cards.forEach(card => observer.observe(card));

// Category tabs
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const category = tab.dataset.category;
    const drinksCard = document.querySelector(".drinks-card");
    const categoryTitles = document.querySelectorAll(".category-title");

    cards.forEach(card => {
      const match =
        category === "all" ||
        card.dataset.category === category;

      card.style.display = match ? "block" : "none";

      if (match) {
        card.classList.add("show");
      }
    });

    // Menü başlıkları sadece Menüler sekmesinde görünsün
categoryTitles.forEach(title => {
  const titleCategory = title.dataset.category;

  title.style.display =
    titleCategory === category ? "block" : "none";
});

    if (drinksCard) {
      const drinksMatch =
        category === "all" ||
        category === "icecekler";

      drinksCard.style.display = drinksMatch ? "block" : "none";
    }

    if (searchInput) {
      searchInput.value = "";
    }

    setTimeout(() => {
      const grid = document.querySelector(".menu-grid");
      const topbar = document.querySelector(".topbar");
      const offset = topbar ? topbar.offsetHeight + 80 : 80;

      window.scrollTo({
        top: grid.offsetTop - offset,
        behavior: "smooth"
      });
    }, 100);
  });
});

// Search
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase().trim();

    cards.forEach(card => {
      const name = card.dataset.name ? card.dataset.name.toLowerCase() : "";
      const visible = name.includes(value);

      card.style.display = visible ? "block" : "none";

      if (visible) {
        card.classList.add("show");
      }
    });
  });
}

// Hero parallax
let ticking = false;

window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      const scrolled = window.scrollY;
      const hero = document.querySelector(".hero-bg");

      if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `scale(1) translateY(${scrolled * 0.15}px)`;
      }

      ticking = false;
    });

    ticking = true;
  }
});

// Scroll to top + Cart
document.addEventListener("DOMContentLoaded", () => {
  const scrollTopBtn = document.getElementById("scrollTopBtn");

  if (scrollTopBtn) {
    scrollTopBtn.classList.remove("show");

    window.addEventListener("scroll", () => {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add("show");
      } else {
        scrollTopBtn.classList.remove("show");
      }
    });

    scrollTopBtn.addEventListener("click", (e) => {
      e.preventDefault();

      scrollTopBtn.style.transform = "scale(0.9)";
      setTimeout(() => {
        scrollTopBtn.style.transform = "";
      }, 150);

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  initCart();
});

function initCart() {
  createCartPanel();
  createCartButton();
  createProductButtons();
  createDrinkButtons();
  renderCart();
}

function createCartButton() {
  const floatingButtons = document.querySelector(".floating-buttons");
  if (!floatingButtons) return;

  if (document.querySelector(".cart-fab")) return;

  const btn = document.createElement("button");
  btn.className = "fab cart-fab";
  btn.innerHTML = `🛒 <span class="cart-count">0</span>`;

  btn.addEventListener("click", () => {
    const panel = document.querySelector(".cart-panel");
    if (panel) panel.classList.toggle("show");
  });

  floatingButtons.prepend(btn);
}

function createCartPanel() {
  if (document.querySelector(".cart-panel")) return;

  const panel = document.createElement("div");
  panel.className = "cart-panel";

  panel.innerHTML = `
    <div class="cart-header">
      <h3>Sepetim</h3>
      <button class="cart-close">&times;</button>
    </div>

    <div class="cart-items"></div>

    <div class="cart-footer">
      <div class="cart-total">
        <span>Toplam</span>
        <strong id="cartTotal">0₺</strong>
      </div>
      <div class="cart-note">
        Bu sepet sipariş oluşturmaz, sadece fiyat hesaplama amaçlıdır.
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  panel.querySelector(".cart-close").addEventListener("click", () => {
    panel.classList.remove("show");
  });
}

function createProductButtons() {
  document.querySelectorAll(".product-card").forEach(card => {
    if (card.classList.contains("drinks-card")) return;

    const title = card.querySelector("h3")?.textContent.trim();
    const sizes = card.querySelectorAll(".sizes span");
    const body = card.querySelector(".card-body");

    if (!title || !body) return;

    // Pizza gibi S M L fiyatları olan ürünler
    if (sizes.length > 0) {
      sizes.forEach(size => {
        size.classList.add("size-cart-btn");
        size.title = "Sepete ekle";

        size.addEventListener("click", () => {
          const text = size.textContent.trim();
          const price = extractPrice(text);
          const sizeName = text.replace(/[0-9₺]/g, "").trim();

          addToCart(`${title} ${sizeName}`, price);
        });
      });
    } else {
      // Normal tek fiyatlı ürünler
      if (body.querySelector(".add-cart-btn")) return;

      const priceText = card.querySelector("strong")?.textContent || "";
      const price = extractPrice(priceText);

      const btn = document.createElement("button");
      btn.className = "add-cart-btn";
      btn.textContent = "Sepete Ekle";

      btn.addEventListener("click", () => {
        addToCart(title, price);
      });

      body.appendChild(btn);
    }
  });
}

function createDrinkButtons() {
  document.querySelectorAll(".drink-item").forEach(item => {
    if (item.querySelector(".drink-add-btn")) return;

    const name = item.querySelector("span")?.textContent.trim();
    const priceText = item.querySelector("strong")?.textContent || "";
    const price = extractPrice(priceText);

    if (!name || !price) return;

    const btn = document.createElement("button");
    btn.className = "drink-add-btn";
    btn.textContent = "+";

    btn.addEventListener("click", () => {
      addToCart(name, price);
    });

    item.appendChild(btn);
  });
}

function extractPrice(text) {
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function addToCart(name, price) {
  if (!price) return;

  const existing = cart.find(item => item.name === name && item.price === price);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      name,
      price,
      qty: 1
    });
  }

  renderCart();
  shakeCartIcon();
}

function renderCart() {
  const cartItems = document.querySelector(".cart-items");
  const cartTotal = document.getElementById("cartTotal");
  const cartCount = document.querySelector(".cart-count");

  if (!cartItems || !cartTotal || !cartCount) return;

  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = `<div class="cart-empty">Henüz ürün eklenmedi.</div>`;
  }

  let total = 0;
  let count = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    count += item.qty;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <div class="cart-item-top">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${itemTotal}₺</div>
      </div>

      <div class="cart-controls">
        <button onclick="changeQty(${index}, -1)">−</button>
        <span>${item.qty}</span>
        <button onclick="changeQty(${index}, 1)">+</button>
        <button class="remove-item" onclick="removeItem(${index})">Sil</button>
      </div>
    `;

    cartItems.appendChild(div);
  });

  cartTotal.textContent = `${total}₺`;
  cartCount.textContent = count;
}

function changeQty(index, amount) {
  if (!cart[index]) return;

  cart[index].qty += amount;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  renderCart();
}

function shakeCartIcon() {
  const cartBtn = document.querySelector(".cart-fab");
  if (!cartBtn) return;

  cartBtn.classList.remove("shake");
  void cartBtn.offsetWidth;
  cartBtn.classList.add("shake");

  setTimeout(() => {
    cartBtn.classList.remove("shake");
  }, 600);
}

// Ürün görsellerini büyütme
document.addEventListener("DOMContentLoaded", () => {
  const imageModal = document.getElementById("imageModal");
  const imageModalImg = document.getElementById("imageModalImg");
  const imageModalClose = document.getElementById("imageModalClose");

  if (!imageModal || !imageModalImg || !imageModalClose) return;

  document.querySelectorAll(".product-card > img").forEach((image) => {
    image.addEventListener("click", () => {
      imageModalImg.src = image.src;
      imageModalImg.alt = image.alt || "Ürün görseli";
      imageModal.classList.add("show");
      document.body.style.overflow = "hidden";
    });
  });

  function closeImageModal() {
    imageModal.classList.remove("show");
    imageModalImg.src = "";
    document.body.style.overflow = "";
  }

  imageModalClose.addEventListener("click", closeImageModal);

  imageModal.addEventListener("click", (event) => {
    if (event.target === imageModal) {
      closeImageModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeImageModal();
    }
  });
});

// Ürün fotoğraflarını büyütme
document.addEventListener("DOMContentLoaded", () => {
  createImageModal();

  document.querySelectorAll(".product-card").forEach(card => {
    if (card.classList.contains("drinks-card")) return;

    const image = card.querySelector(":scope > img");
    if (!image) return;

    card.classList.add("image-zoom-card");

    // Aynı ikon tekrar oluşmasın
    if (!card.querySelector(".image-zoom-icon")) {
      const zoomButton = document.createElement("button");

      zoomButton.type = "button";
      zoomButton.className = "image-zoom-icon";
      zoomButton.setAttribute("aria-label", "Fotoğrafı büyüt");
      zoomButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/>
        </svg>
      `;

      zoomButton.addEventListener("click", event => {
        event.stopPropagation();
        openImageModal(image);
      });

      card.appendChild(zoomButton);
    }

    image.addEventListener("click", () => {
      openImageModal(image);
    });
  });
});

function createImageModal() {
  if (document.querySelector(".image-modal")) return;

  const modal = document.createElement("div");
  modal.className = "image-modal";

  modal.innerHTML = `
    <button
      type="button"
      class="image-modal-close"
      aria-label="Fotoğrafı kapat"
    >
      &times;
    </button>

    <img src="" alt="">
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", event => {
    if (
      event.target === modal ||
      event.target.classList.contains("image-modal-close")
    ) {
      closeImageModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeImageModal();
    }
  });
}

function openImageModal(image) {
  const modal = document.querySelector(".image-modal");
  const modalImage = modal?.querySelector("img");

  if (!modal || !modalImage) return;

  modalImage.src = image.src;
  modalImage.alt = image.alt || "Ürün fotoğrafı";

  modal.classList.add("show");
  document.body.classList.add("modal-open");
}

function closeImageModal() {
  const modal = document.querySelector(".image-modal");

  if (!modal) return;

  modal.classList.remove("show");
  document.body.classList.remove("modal-open");
}