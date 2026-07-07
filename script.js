const loader = document.querySelector(".loader");
const tabs = document.querySelectorAll(".tab");
const cards = document.querySelectorAll(".product-card");
const searchInput = document.getElementById("searchInput");
const themeBtn = document.getElementById("themeBtn");

window.addEventListener("load", () => {
  setTimeout(() => {
    loader.classList.add("hide");

    const floatingButtons = document.querySelector(".floating-buttons");
    if (floatingButtons) {
      floatingButtons.classList.add("show");
    }

  }, 900);
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
}, {
  threshold: 0.18
});

cards.forEach(card => observer.observe(card));

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const category = tab.dataset.category;

    cards.forEach(card => {
      const match = category === "all" || card.dataset.category === category;
      card.style.display = match ? "block" : "none";

      if (match) {
        card.classList.add("show");
      }
    });

    searchInput.value = "";

    setTimeout(() => {
      const grid = document.querySelector(".menu-grid");
      const topbar = document.querySelector(".topbar");
      const offset = topbar ? topbar.offsetHeight + 20 : 20;

      window.scrollTo({
        top: grid.offsetTop - offset,
        behavior: "smooth"
      });
    }, 100);
  });
});

searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase().trim();

  cards.forEach(card => {
    const name = card.dataset.name.toLowerCase();
    const visible = name.includes(value);

    card.style.display = visible ? "block" : "none";
  });
});


document.addEventListener("mousemove", (e) => {
  const x = e.clientX / window.innerWidth - 0.5;
  const y = e.clientY / window.innerHeight - 0.5;

  document.querySelectorAll(".product-card").forEach(card => {
    card.style.transform = `translateY(0) rotateX(${y * 3}deg) rotateY(${x * 3}deg)`;
  });
});

document.addEventListener("mouseleave", () => {
  document.querySelectorAll(".product-card").forEach(card => {
    card.style.transform = "";
  });
});

document.addEventListener("DOMContentLoaded", () => {
    const scrollTopBtn = document.getElementById("scrollTopBtn");

    if (!scrollTopBtn) return;

    // Sayfa açılınca gizli başlasın
    scrollTopBtn.classList.remove("show");

    // Scroll olunca göster/gizle
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add("show");
        } else {
            scrollTopBtn.classList.remove("show");
        }
    });

    // Tıklayınca yukarı çık
    scrollTopBtn.addEventListener("click", (e) => {
        e.preventDefault();

        // Küçük tıklama animasyonu
        scrollTopBtn.classList.add("clicked");
        setTimeout(() => {
            scrollTopBtn.classList.remove("clicked");
        }, 250);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});