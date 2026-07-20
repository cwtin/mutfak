import { database } from "./firebase-config.js";

import {
  ref,
  get,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


document.addEventListener("DOMContentLoaded", async () => {
  try {
    await synchronizeMenu();
    listenMenuUpdates();
  } catch (error) {
    console.error("Firebase menü hatası:", error);
  }
});


/*
  ============================================================
  HTML ↔ FIREBASE SENKRONİZASYONU
  ============================================================

  - HTML'e eklenen ürün Firebase'e eklenir.
  - HTML'den kaldırılan ürün Firebase'den silinir.
  - Admin panelindeki fiyat, açıklama ve kalori korunur.
  - Eski product_001 ve drink_001 kayıtları yeni ID'lere taşınır.
  - Gereksiz Firebase yazmaları yapılmaz.
  - data-product-id kullanılırsa ürün adı değişse bile kayıt korunur.
*/

async function synchronizeMenu() {
  const productsRef = ref(database, "products");
  const snapshot = await get(productsRef);

  const existingProducts = snapshot.val() || {};
  const updates = {};
  const htmlProductIds = new Set();

  const productCards = Array.from(
    document.querySelectorAll(
      ".product-card:not(.drinks-card)"
    )
  );

  const drinkItems = Array.from(
    document.querySelectorAll(".drink-item")
  );


  /*
    NORMAL ÜRÜNLER
  */

  productCards.forEach((card, index) => {
    const stableId = createStableProductId(card);
    const oldId = createOldProductId(index);

    checkDuplicateId(
      htmlProductIds,
      stableId,
      getProductName(card)
    );

    htmlProductIds.add(stableId);
    card.dataset.firebaseId = stableId;

    const htmlProduct = getProductFromCard(
      card,
      index + 1
    );

    const stableProduct =
      existingProducts[stableId];

    const oldProduct =
      existingProducts[oldId];


    /*
      Sabit ID zaten Firebase'de varsa
      admin ayarlarını koru.
    */

    if (stableProduct) {
      const synchronizedProduct =
        mergeProductData(
          stableProduct,
          htmlProduct
        );

      if (
        hasProductChanged(
          stableProduct,
          synchronizedProduct
        )
      ) {
        updates[`products/${stableId}`] =
          synchronizedProduct;
      }

      return;
    }


    /*
      Eski product_001 kaydı varsa
      yeni sabit ID sistemine taşı.
    */

    if (oldProduct) {
      updates[`products/${stableId}`] =
        mergeProductData(
          oldProduct,
          htmlProduct
        );

      updates[`products/${oldId}`] = null;

      return;
    }


    /*
      Tamamen yeni ürün.
    */

    updates[`products/${stableId}`] =
      createNewProduct(htmlProduct);
  });


  /*
    İÇECEKLER
  */

  drinkItems.forEach((item, index) => {
    const stableId =
      createStableDrinkId(item);

    const oldId =
      createOldDrinkId(index);

    checkDuplicateId(
      htmlProductIds,
      stableId,
      getDrinkName(item)
    );

    htmlProductIds.add(stableId);
    item.dataset.firebaseId = stableId;

    const htmlProduct =
      getDrinkProduct(
        item,
        productCards.length + index + 1
      );

    const stableProduct =
      existingProducts[stableId];

    const oldProduct =
      existingProducts[oldId];


    /*
      Sabit içecek kaydı zaten varsa.
    */

    if (stableProduct) {
      const synchronizedProduct =
        mergeProductData(
          stableProduct,
          htmlProduct
        );

      if (
        hasProductChanged(
          stableProduct,
          synchronizedProduct
        )
      ) {
        updates[`products/${stableId}`] =
          synchronizedProduct;
      }

      return;
    }


    /*
      Eski drink_001 kaydını taşı.
    */

    if (oldProduct) {
      updates[`products/${stableId}`] =
        mergeProductData(
          oldProduct,
          htmlProduct
        );

      updates[`products/${oldId}`] = null;

      return;
    }


    /*
      Tamamen yeni içecek.
    */

    updates[`products/${stableId}`] =
      createNewProduct(htmlProduct);
  });


  /*
    HTML'DEN SİLİNEN ÜRÜNLERİ
    FIREBASE'DEN KALDIR
  */

  Object.entries(existingProducts)
    .forEach(([id, product]) => {
      const isOldProductId =
        /^product_\d+$/.test(id);

      const isOldDrinkId =
        /^drink_\d+$/.test(id);

      /*
        Eski kayıtları burada silmiyoruz.
        Taşıma işlemi yukarıda yapılıyor.
      */

      if (
        isOldProductId ||
        isOldDrinkId
      ) {
        return;
      }


      /*
        Sadece HTML sistemi tarafından
        yönetilen kayıtları silebilir.
      */

      const isHtmlManaged =
        product?.managedBy === "html";

      if (
        isHtmlManaged &&
        !htmlProductIds.has(id)
      ) {
        updates[`products/${id}`] = null;

        console.log(
          `HTML'den kaldırılan ürün silindi: ${id}`
        );
      }
    });


  /*
    DEĞİŞİKLİK YOKSA FIREBASE'E YAZMA
  */

  if (
    Object.keys(updates).length === 0
  ) {
    console.log(
      "Menü zaten güncel."
    );

    return;
  }


  await update(
    ref(database),
    updates
  );

  console.log(
    "HTML ve Firebase senkronize edildi."
  );
}


/*
  ============================================================
  ÜRÜN VERİLERİNİ BİRLEŞTİR
  ============================================================

  Firebase'deki şu bilgiler korunur:

  - priceText
  - description
  - calorie
  - calorieVisible

  HTML'den şu bilgiler güncellenir:

  - name
  - category
  - categoryLabel
  - order
*/

function mergeProductData(
  existingProduct,
  htmlProduct
) {
  return {
    ...htmlProduct,
    ...existingProduct,

    name: htmlProduct.name,
    category: htmlProduct.category,
    categoryLabel:
      htmlProduct.categoryLabel,
    order: htmlProduct.order,

    managedBy: "html",
    schemaVersion: 2
  };
}


/*
  YENİ FIREBASE ÜRÜNÜ
*/

function createNewProduct(htmlProduct) {
  const now = Date.now();

  return {
    ...htmlProduct,

    calorie: "",
    calorieVisible: true,

    managedBy: "html",
    schemaVersion: 2,

    createdAt: now,
    updatedAt: now
  };
}


/*
  GEREKSİZ FIREBASE YAZMALARINI ENGELLE
*/

function hasProductChanged(
  oldProduct,
  newProduct
) {
  const comparedFields = [
    "name",
    "category",
    "categoryLabel",
    "order",
    "managedBy",
    "schemaVersion"
  ];

  return comparedFields.some(
    (field) =>
      oldProduct?.[field] !==
      newProduct?.[field]
  );
}


/*
  AYNI ID İKİ KEZ OLUŞURSA
  HATA VER
*/

function checkDuplicateId(
  idSet,
  id,
  productName
) {
  if (!idSet.has(id)) {
    return;
  }

  throw new Error(
    `"${productName}" ürünü için aynı Firebase ID iki kez oluştu: ${id}. ` +
    `Ürünlere farklı data-product-id değerleri ekleyin.`
  );
}


/*
  ============================================================
  FIREBASE DEĞİŞİKLİKLERİNİ DİNLE
  ============================================================
*/

function listenMenuUpdates() {
  const productsRef =
    ref(database, "products");

  onValue(productsRef, (snapshot) => {
    const products =
      snapshot.val() || {};

    assignFirebaseIds();

    Object.entries(products)
      .forEach(([id, product]) => {
        updateMenuProduct(
          id,
          product
        );
      });
  });
}


/*
  HTML ELEMANLARINA
  FIREBASE ID VER
*/

function assignFirebaseIds() {
  document
    .querySelectorAll(
      ".product-card:not(.drinks-card)"
    )
    .forEach((card) => {
      card.dataset.firebaseId =
        createStableProductId(card);
    });

  document
    .querySelectorAll(".drink-item")
    .forEach((item) => {
      item.dataset.firebaseId =
        createStableDrinkId(item);
    });
}


/*
  ============================================================
  HTML ÜRÜN BİLGİLERİNİ OKU
  ============================================================
*/

function getProductFromCard(
  card,
  order
) {
  const name =
    getProductName(card);

  const description =
    card
      .querySelector(".card-body p")
      ?.textContent.trim() || "";

  const category =
    card.dataset.category || "diger";

  return {
    name,
    description,
    category,

    categoryLabel:
      getCategoryLabel(category),

    priceText:
      getCardPriceText(card),

    order
  };
}


function getDrinkProduct(
  item,
  order
) {
  const name =
    getDrinkName(item);

  const priceText =
    item
      .querySelector("strong")
      ?.textContent.trim() || "";

  return {
    name,
    description: "",

    category: "icecekler",
    categoryLabel: "İçecekler",

    priceText,
    order
  };
}


function getProductName(card) {
  return (
    card
      .querySelector(".card-body h3")
      ?.textContent.trim() ||

    card.dataset.name ||

    "Ürün"
  );
}


function getDrinkName(item) {
  return (
    item
      .querySelector("span")
      ?.textContent.trim() ||

    "İçecek"
  );
}


/*
  ============================================================
  FIREBASE VERİSİNİ MENÜYE YANSIT
  ============================================================
*/

function updateMenuProduct(
  id,
  product
) {
  const element =
    document.querySelector(
      `[data-firebase-id="${escapeSelector(id)}"]`
    );

  if (!element) {
    return;
  }

  if (
    element.classList.contains(
      "drink-item"
    )
  ) {
    updateDrinkItem(
      element,
      product
    );

    return;
  }

  updateProductCard(
    element,
    product
  );
}


/*
  NORMAL ÜRÜN KARTI
*/

function updateProductCard(
  card,
  product
) {
  const descriptionElement =
    card.querySelector(
      ".card-body p"
    );

  if (
    descriptionElement &&
    product.description !== undefined
  ) {
    descriptionElement.textContent =
      product.description;
  }


  updateCalorie(
    card,
    product
  );


  if (
    product.priceText === undefined
  ) {
    return;
  }


  const sizeElements =
    card.querySelectorAll(
      ".sizes span"
    );


  /*
    Pizza boy fiyatları.
  */

  if (sizeElements.length > 0) {
    updatePizzaSizes(
      sizeElements,
      product.priceText
    );

    return;
  }


  /*
    Normal ürün fiyatı.
  */

  const priceElement =
    card.querySelector(
      ".card-body strong"
    );

  if (priceElement) {
    priceElement.textContent =
      product.priceText;
  }
}


/*
  PİZZA BOY FİYATLARI

  Firebase örneği:

  S 250₺ | M 320₺ | L 390₺
*/

function updatePizzaSizes(
  sizeElements,
  priceText
) {
  const prices =
    String(priceText)
      .split("|")
      .map((price) =>
        price.trim()
      )
      .filter(Boolean);


  if (
    prices.length ===
    sizeElements.length
  ) {
    sizeElements.forEach(
      (element, index) => {
        element.textContent =
          prices[index];
      }
    );

    return;
  }


  if (
    priceText &&
    sizeElements[0]
  ) {
    sizeElements[0].textContent =
      priceText;
  }
}


/*
  İÇECEK FİYATI
*/

function updateDrinkItem(
  item,
  product
) {
  const priceElement =
    item.querySelector("strong");

  if (
    priceElement &&
    product.priceText !== undefined
  ) {
    priceElement.textContent =
      product.priceText;
  }
}


/*
  HTML'DEKİ ÜRÜN FİYATINI OKU
*/

function getCardPriceText(card) {
  const sizeElements =
    card.querySelectorAll(
      ".sizes span"
    );


  if (sizeElements.length > 0) {
    return Array
      .from(sizeElements)
      .map((element) =>
        element.textContent.trim()
      )
      .join(" | ");
  }


  return (
    card
      .querySelector(
        ".card-body strong"
      )
      ?.textContent.trim() || ""
  );
}


/*
  ============================================================
  SABİT FIREBASE ID SİSTEMİ
  ============================================================

  En güvenli kullanım:

  data-product-id="americana"

  data-product-id varsa ürün adı değişse bile
  Firebase kaydı değişmez.
*/


function createStableProductId(card) {
  const manualId =
    card.dataset.productId?.trim();

  if (manualId) {
    return `urun-${slugify(manualId)}`;
  }


  const category =
    card.dataset.category || "diger";

  const name =
    getProductName(card);

  return (
    `${slugify(category)}-${slugify(name)}`
  );
}


function createStableDrinkId(item) {
  const manualId =
    item.dataset.productId?.trim();

  if (manualId) {
    return (
      `icecek-${slugify(manualId)}`
    );
  }


  const name =
    getDrinkName(item);

  return (
    `icecek-${slugify(name)}`
  );
}


/*
  ESKİ FIREBASE ID SİSTEMİ
*/

function createOldProductId(index) {
  return (
    `product_${String(index + 1)
      .padStart(3, "0")}`
  );
}


function createOldDrinkId(index) {
  return (
    `drink_${String(index + 1)
      .padStart(3, "0")}`
  );
}


/*
  ============================================================
  TÜRKÇE SLUG
  ============================================================
*/

function slugify(text) {
  return String(text)
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


/*
  QUERY SELECTOR GÜVENLİĞİ
*/

function escapeSelector(value) {
  if (
    window.CSS &&
    typeof window.CSS.escape ===
      "function"
  ) {
    return window.CSS.escape(value);
  }

  return String(value)
    .replace(
      /["\\]/g,
      "\\$&"
    );
}


/*
  ============================================================
  KATEGORİLER
  ============================================================
*/

function getCategoryLabel(category) {
  const categories = {
    pizza: "Pizzalar",
    menu: "Pizza Menüler",
    menuler: "Menüler",
    aperatif: "Aperatifler",
    makarna: "Makarnalar",
    tatli: "Tatlılar",
    icecekler: "İçecekler"
  };

  return (
    categories[category] ||
    category
  );
}


/*
  ============================================================
  KALORİ
  ============================================================
*/

function updateCalorie(
  card,
  product
) {
  let calorieElement =
    card.querySelector(
      ".product-calorie"
    );


  const calorieValue =
    Number(
      product.calorie || 0
    );


  const shouldShow =
    product.calorieVisible !== false &&
    calorieValue > 0;


  /*
    Kalori gizliyse veya sıfırsa kaldır.
  */

  if (!shouldShow) {
    if (calorieElement) {
      calorieElement.remove();
    }

    return;
  }


  /*
    Kalori alanı yoksa oluştur.
  */

  if (!calorieElement) {
    calorieElement =
      document.createElement("div");

    calorieElement.className =
      "product-calorie";


    const cardBody =
      card.querySelector(
        ".card-body"
      );

    if (!cardBody) {
      return;
    }


    const description =
      cardBody.querySelector("p");


    if (description) {
      description
        .insertAdjacentElement(
          "afterend",
          calorieElement
        );
    } else {
      cardBody.appendChild(
        calorieElement
      );
    }
  }


  calorieElement.textContent =
    `${calorieValue} kcal`;
}