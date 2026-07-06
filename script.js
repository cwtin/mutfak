const loader = document.querySelector(".loader");
const tabs = document.querySelectorAll(".tab");
const cards = document.querySelectorAll(".product-card");
const searchInput = document.getElementById("searchInput");
const themeBtn = document.getElementById("themeBtn");

window.addEventListener("load", () => {
  setTimeout(() => {
    loader.classList.add("hide");
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

      setTimeout(() => {
        if (match) card.classList.add("show");
      }, 80);
    });
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