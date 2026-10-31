const products = [
  {
    name: "EcoFlow 240 Wh RIVER 2",
    category: "PowerStation",
    description: "Check out EcoFlow 240 Wh RIVER 2 Portable Power Station 220V Solar Generator with Solar Panel LiFeP04 Quick Charge in 1 Hour Up to 600 W Power for Emergency Power Camping Motor Homes Home for ₱9,990 - ₱19,480. Get it on Shopee now!",
    image: "images/shop/powerstation.png",
    link: "https://s.shopee.ph/2BG5K0qcst"
  },
  {
    name: "Sandisk 480GB 1TB SSD PLUS SATA III 2.5",
    category: "Storage",
    description: "Check out Sandisk 480GB 1TB SSD PLUS SATA III 2.5 Solid State Drive | Internal SSD | Sata SSD | Desktop SSD for ₱1,556 - ₱2,479. Get it on Shopee now!",
    image: "images/shop/ssd.png",
    link: "https://s.shopee.ph/7puS2neuuG"
  },
  {
    name: "FlashFish E103 Portable Power Station 300W",
    category: "PowerStation",
    description: "Check out FlashFish E103 Portable Power Station 300W LiFePO4 Battery Solar Generator Set UPS Laptop Powerbank for ₱8,099 - ₱22,390. Get it on Shopee now!",
    image: "images/shop/powerstation1.png",
    link: "https://s.shopee.ph/9pfWSmEium"
  },
  {
    name: "Acer Nitro VG0",
    category: "Monitor",
    description: "Check out Acer Nitro VG0 VG240Y X1BMIIPX 23.8 FHD 1920x1080 IPS Technology 1ms 200Hz Gaming Monitor for ₱6,299. Get it on Shopee now!",
    image: "images/shop/monitor.png",
    link: "https://s.shopee.ph/70LL65U76G"
  },
  {
    name: "BROTHER DCP-T730W",
    category: "Printer",
    description: "Check out BROTHER DCP-T730W 3IN1 PRINTER for ₱14,950. Get it on Shopee now!",
    image: "images/shop/printer.png",
    link: "https://s.shopee.ph/gRHZt94MS"
  }
];

const productGrid = document.getElementById("productGrid");
const emptyMessage = document.getElementById("emptyMessage");

function renderProducts(category = "All") {
  const filtered = category === "All"
    ? products
    : products.filter(product => product.category === category);

  productGrid.innerHTML = "";

  emptyMessage.hidden = filtered.length > 0;

  filtered.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const image = document.createElement("img");
    image.className = "product-image";
    image.src = product.image;
    image.alt = product.name;
    image.loading = "lazy";
    image.onerror = () => {
      image.onerror = null;
      image.src = "images/shop/placeholder.png";
    };

    const info = document.createElement("div");
    info.className = "product-info";

    const categoryText = document.createElement("span");
    categoryText.className = "product-category";
    categoryText.textContent = product.category;

    const title = document.createElement("h3");
    title.textContent = product.name;

    const description = document.createElement("p");
    description.textContent = product.description;

    info.append(categoryText, title, description);

    const link = document.createElement("a");
    link.className = "product-link";
    link.textContent = "View Product";
    link.href = product.link;
    link.target = "_blank";
    link.rel = "sponsored noopener noreferrer";

    const validLink =
      /^https:\/\/(?:shope\.ee|s\.shopee\.ph|shopee\.ph)\//i
        .test(product.link) &&
      !product.link.includes("PASTE_YOUR");

    if (!validLink) {
      link.removeAttribute("href");
      link.removeAttribute("target");
      link.textContent = "Affiliate link not added";
      link.style.opacity = "0.6";
      link.style.cursor = "not-allowed";
    }

    info.appendChild(link);
    card.append(image, info);
    productGrid.appendChild(card);
  });
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter")
      .forEach(item => item.classList.remove("active"));

    button.classList.add("active");
    renderProducts(button.dataset.category);
  });
});

renderProducts();
