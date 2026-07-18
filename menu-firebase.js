import { database } from "./firebase-config.js";

import {
  ref,
  get,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initializeMenuDatabase();
    listenMenuUpdates();
  } catch (error) {
    console.error("Firebase menü hatası:", error);
  }
});


// İLK AÇILIŞTA HTML ÜRÜNLERİNİ FIREBASE'A AKTAR

async function initializeMenuDatabase() {
  const productsRef = ref(database, "products");
  const snapshot = await get(productsRef);

  if (snapshot.exists()) {
    return;
  }

  const productCards = document.querySelectorAll(
    ".product-card:not(.drinks-card)"
  );

  const products = {};

  productCards.forEach((card, index) => {
    const id = createProductId(index);

    card.dataset.firebaseId = id;

    const name =
      card.querySelector(".card-body h3")?.textContent.trim() ||
      `Ürün ${index + 1}`;

    const description =
      card.querySelector(".card-body p")?.textContent.trim() || "";

    const category = card.dataset.category || "diger";

    const categoryLabel = getCategoryLabel(category);

    const priceText = getCardPriceText(card);

    products[id] = {
      name,
      description,
      category,
      categoryLabel,
      priceText,
      order: index + 1,
      updatedAt: Date.now()
    };
  });

  const drinkItems = document.querySelectorAll(".drink-item");

  drinkItems.forEach((item, index) => {
    const id = `drink_${String(index + 1).padStart(3, "0")}`;

    item.dataset.firebaseId = id;

    const name =
      item.querySelector("span")?.textContent.trim() ||
      `İçecek ${index + 1}`;

    const priceText =
      item.querySelector("strong")?.textContent.trim() || "";

    products[id] = {
      name,
      description: "",
      category: "icecekler",
      categoryLabel: "İçecekler",
      priceText,
      order: productCards.length + index + 1,
      updatedAt: Date.now()
    };
  });

  await set(productsRef, products);

  console.log("Mevcut menü Firebase'a aktarıldı.");
}


// FIREBASE DEĞİŞİKLİKLERİNİ DİNLE

function listenMenuUpdates() {
  const productsRef = ref(database, "products");

  onValue(productsRef, (snapshot) => {
    const products = snapshot.val() || {};

    assignFirebaseIds();

    Object.entries(products).forEach(([id, product]) => {
      updateMenuProduct(id, product);
    });
  });
}


// HTML ELEMANLARINA AYNI ID'LERİ VER

function assignFirebaseIds() {
  const productCards = document.querySelectorAll(
    ".product-card:not(.drinks-card)"
  );

  productCards.forEach((card, index) => {
    card.dataset.firebaseId = createProductId(index);
  });

  const drinkItems = document.querySelectorAll(".drink-item");

  drinkItems.forEach((item, index) => {
    item.dataset.firebaseId =
      `drink_${String(index + 1).padStart(3, "0")}`;
  });
}


// MENÜDEKİ ÜRÜNÜ GÜNCELLE

function updateMenuProduct(id, product) {
  const element = document.querySelector(
    `[data-firebase-id="${id}"]`
  );

  if (!element) return;

  if (element.classList.contains("drink-item")) {
    updateDrinkItem(element, product);
    return;
  }

  updateProductCard(element, product);
}


// NORMAL ÜRÜN KARTI

function updateProductCard(card, product) {
  const descriptionElement = card.querySelector(".card-body p");

  if (descriptionElement && product.description !== undefined) {
    descriptionElement.textContent = product.description;
  }

  if (product.priceText === undefined) return;

  const sizes = card.querySelectorAll(".sizes span");

  if (sizes.length > 0) {
    updatePizzaSizes(sizes, product.priceText);
    return;
  }

  const priceElement = card.querySelector(".card-body strong");

  if (priceElement) {
    priceElement.textContent = product.priceText;
  }
}


// PİZZA FİYATLARI

function updatePizzaSizes(sizeElements, priceText) {
  const prices = String(priceText)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  if (prices.length === sizeElements.length) {
    sizeElements.forEach((element, index) => {
      element.textContent = prices[index];
    });

    return;
  }

  if (priceText) {
    sizeElements[0].textContent = priceText;
  }
}


// İÇECEK

function updateDrinkItem(item, product) {
  const priceElement = item.querySelector("strong");

  if (priceElement && product.priceText !== undefined) {
    priceElement.textContent = product.priceText;
  }
}


// İLK FİYATI OKU

function getCardPriceText(card) {
  const sizes = card.querySelectorAll(".sizes span");

  if (sizes.length > 0) {
    return Array.from(sizes)
      .map((size) => size.textContent.trim())
      .join(" | ");
  }

  return card.querySelector(".card-body strong")?.textContent.trim() || "";
}


// FIREBASE ID

function createProductId(index) {
  return `product_${String(index + 1).padStart(3, "0")}`;
}


// KATEGORİ İSMİ

function getCategoryLabel(category) {
  const categories = {
    pizza: "Pizzalar",
    menu: "Menüler",
    aperatif: "Aperatifler",
    makarna: "Makarnalar",
    tatli: "Tatlılar",
    icecekler: "İçecekler"
  };

  return categories[category] || category;
}