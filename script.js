const loader = document.querySelector(".loader");
const tabs = document.querySelectorAll(".tab");
const cards = document.querySelectorAll(".product-card");
const searchInput = document.getElementById("searchInput");

// Loader
window.addEventListener("load", () => {
  setTimeout(() => {
    loader.classList.add("hide");

    const floatingButtons = document.querySelector(".floating-buttons");
    if (floatingButtons) {
      floatingButtons.classList.add("show");
    }

    // Trigger card animations
    cards.forEach((card, index) => {
      setTimeout(() => {
        if (card.getBoundingClientRect().top < window.innerHeight) {
          card.classList.add("show");
        }
      }, index * 50);
    });

  }, 800);
});

// Intersection Observer for cards
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

    // Hide drinks card differently - it's not a product-card in the same way
    const drinksCard = document.querySelector(".drinks-card");

    cards.forEach(card => {
      const match = category === "all" || card.dataset.category === category;
      card.style.display = match ? "block" : "none";

      if (match) {
        card.classList.add("show");
      }
    });

    if (drinksCard) {
      const drinksMatch = category === "all" || category === "icecekler";
      drinksCard.style.display = drinksMatch ? "block" : "none";
    }

    searchInput.value = "";

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
searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase().trim();

  cards.forEach(card => {
    const name = card.dataset.name.toLowerCase();
    const visible = name.includes(value);

    card.style.display = visible ? "block" : "none";

    if (visible) {
      card.classList.add("show");
    }
  });
});

// Subtle parallax on hero (performance optimized)
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

// Scroll to top button
document.addEventListener("DOMContentLoaded", () => {
  const scrollTopBtn = document.getElementById("scrollTopBtn");

  if (!scrollTopBtn) return;

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
});
