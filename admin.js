import { auth, database } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  ref,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


const loginPage = document.getElementById("loginPage");
const adminPage = document.getElementById("adminPage");

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordToggle = document.getElementById("passwordToggle");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

const logoutButton = document.getElementById("logoutButton");

const productsList = document.getElementById("productsList");
const loadingBox = document.getElementById("loadingBox");
const emptyBox = document.getElementById("emptyBox");
const productCount = document.getElementById("productCount");
const adminSearch = document.getElementById("adminSearch");

const connectionStatus = document.getElementById("connectionStatus");
const lastUpdate = document.getElementById("lastUpdate");

const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");

let products = {};
let searchValue = "";
let productsListenerStarted = false;


/* ŞİFREYİ GÖSTER / GİZLE */

passwordToggle.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";

  passwordInput.type = isPassword ? "text" : "password";
  passwordToggle.textContent = isPassword ? "Gizle" : "Göster";
});


/* GİRİŞ */

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  loginMessage.textContent = "";
  loginButton.disabled = true;
  loginButton.textContent = "Giriş yapılıyor...";

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log(
      "Giriş başarılı:",
      userCredential.user.email
    );

    loginForm.reset();

    loginPage.classList.add("hidden");
    adminPage.classList.remove("hidden");

    startProductsListener();
  } catch (error) {
    console.error("Giriş hatası:", error);

    loginMessage.textContent =
      getLoginErrorMessage(error.code);
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Giriş Yap";
  }
});


/* OTURUM KONTROLÜ */

onAuthStateChanged(auth, (user) => {
  console.log("Oturum durumu:", user);

  if (user) {
    loginPage.classList.add("hidden");
    adminPage.classList.remove("hidden");

    startProductsListener();
  } else {
    adminPage.classList.add("hidden");
    loginPage.classList.remove("hidden");
  }
});


/* ÇIKIŞ */

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Çıkış hatası:", error);

    showToast(
      "Çıkış yapılırken hata oluştu.",
      true
    );
  }
});


/* ÜRÜNLERİ DİNLE */

function startProductsListener() {
  if (productsListenerStarted) {
    return;
  }

  productsListenerStarted = true;

  const productsRef = ref(database, "products");

  onValue(
    productsRef,
    (snapshot) => {
      products = snapshot.val() || {};

      loadingBox.classList.add("hidden");

      connectionStatus.classList.add("connected");

      connectionStatus.innerHTML = `
        <span class="status-dot"></span>
        Firebase bağlantısı aktif
      `;

      updateStatistics();
      renderProducts();
    },
    (error) => {
      console.error("Veritabanı hatası:", error);

      loadingBox.classList.add("hidden");

      connectionStatus.classList.remove("connected");

      connectionStatus.innerHTML = `
        <span class="status-dot"></span>
        Bağlantı hatası
      `;

      showToast(
        "Ürünler alınamadı.",
        true
      );
    }
  );
}
/* ÜRÜNLERİ ÇİZ */

function renderProducts() {

  productsList.innerHTML = "";

  const entries = Object.entries(products);

  if (entries.length === 0) {
    emptyBox.classList.remove("hidden");
    return;
  }

  emptyBox.classList.add("hidden");

  const filtered = entries.filter(([id, product]) => {

    const name = String(product.name || "")
      .toLowerCase();

    const category = String(product.category || "")
      .toLowerCase();

    const q = searchValue.toLowerCase();

    return name.includes(q) || category.includes(q);

  });

  filtered.sort((a, b) => {

    return (a[1].order || 0) - (b[1].order || 0);

  });

  filtered.forEach(([id, product]) => {

    productsList.appendChild(
      createProductCard(id, product)
    );

  });

}



/* ÜRÜN KARTI */

function createProductCard(id, product) {

  const card = document.createElement("div");

  card.className = "product-editor";

card.innerHTML = `

<div class="product-editor-header">

  <div>
    <h3>${product.name}</h3>

    <div class="product-category">
      ${product.categoryLabel || product.category}
    </div>
  </div>

</div>

<div class="editor-fields">

  <div class="editor-group">
    <label>Fiyat</label>

    <input
      class="edit-input price"
      type="text"
      value="${product.priceText || ""}"
    >
  </div>

  <div class="editor-group">
    <label>Açıklama</label>

    <textarea class="edit-textarea desc">${
      product.description || ""
    }</textarea>
  </div>

  <div class="editor-group">
    <label>Kalori</label>

    <input
      class="edit-input calorie"
      type="number"
      min="0"
      value="${product.calorie || ""}"
      placeholder="Örnek: 650"
    >
  </div>

  <div class="editor-group">
    <label class="calorie-toggle-label">
      <input
        type="checkbox"
        class="calorie-visible"
        ${product.calorieVisible !== false ? "checked" : ""}
      >
      Kaloriyi menüde göster
    </label>
  </div>

  <button class="save-button">
    Kaydet
  </button>

</div>

`;

  const btn = card.querySelector(".save-button");

btn.onclick = () => {
  saveProduct(
    id,
    card.querySelector(".price").value,
    card.querySelector(".desc").value,
    card.querySelector(".calorie").value,
    card.querySelector(".calorie-visible").checked,
    btn
  );
};

  return card;

}
/* ÜRÜNÜ KAYDET */

async function saveProduct(
  id,
  priceText,
  description,
  calorie,
  calorieVisible,
  button
) {
  if (!id) return;

  button.disabled = true;
  button.textContent = "Kaydediliyor...";

  try {
    await update(
      ref(database, `products/${id}`),
      {
        priceText: priceText.trim(),
        description: description.trim(),
        calorie: calorie ? Number(calorie) : "",
        calorieVisible: Boolean(calorieVisible),
        updatedAt: Date.now()
      }
    );

    showToast("Ürün başarıyla güncellendi.");
  } catch (error) {
    console.error("Kayıt hatası:", error);

    showToast(
      "Ürün kaydedilemedi.",
      true
    );
  } finally {
    button.disabled = false;
    button.textContent = "Kaydet";
  }
}


/* ARAMA */

adminSearch.addEventListener("input", () => {
  searchValue = adminSearch.value.trim();
  renderProducts();
});


/* İSTATİSTİKLER */

function updateStatistics() {
  const productValues = Object.values(products);

  productCount.textContent = productValues.length;

  const updateTimes = productValues
    .map((product) => Number(product.updatedAt || 0))
    .filter((time) => time > 0);

  if (updateTimes.length === 0) {
    lastUpdate.textContent = "Henüz yok";
    return;
  }

  const latestUpdate = Math.max(...updateTimes);

  lastUpdate.textContent =
    new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(latestUpdate));
}


/* BİLDİRİM */

function showToast(message, isError = false) {
  toastText.textContent = message;

  toast.classList.toggle("error", isError);
  toast.classList.add("show");

  clearTimeout(showToast.timeout);

  showToast.timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


/* GİRİŞ HATA MESAJLARI */

function getLoginErrorMessage(errorCode) {
  const messages = {
    "auth/invalid-email":
      "E-posta adresi geçersiz.",

    "auth/user-disabled":
      "Bu kullanıcı hesabı kapatılmış.",

    "auth/user-not-found":
      "Kullanıcı bulunamadı.",

    "auth/wrong-password":
      "Şifre yanlış.",

    "auth/invalid-credential":
      "E-posta veya şifre yanlış.",

    "auth/too-many-requests":
      "Çok fazla hatalı giriş yapıldı. Bir süre sonra tekrar deneyin."
  };

  return messages[errorCode] ||
    "Giriş yapılamadı. Bilgileri kontrol edin.";
}