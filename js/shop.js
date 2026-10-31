
const products = [
  {
    name: "Wireless Keyboard and Mouse",
    category: "Accessories",
    description: "Wireless computer keyboard and mouse set.",
    image: "images/shop/keyboard.jpg",
    link: "PASTE_YOUR_SHOPEE_AFFILIATE_LINK_HERE"
  },
  {
    name: "Computer SSD Storage",
    category: "Storage",
    description: "Upgrade computer storage performance.",
    image: "images/shop/ssd.jpg",
    link: "PASTE_YOUR_SHOPEE_AFFILIATE_LINK_HERE"
  },
  {
    name: "Desktop RAM Memory",
    category: "Storage",
    description: "Memory upgrade for compatible computers.",
    image: "images/shop/ram.jpg",
    link: "PASTE_YOUR_SHOPEE_AFFILIATE_LINK_HERE"
  },
  {
    name: "Epson Printer",
    category: "Printers",
    description: "Explore printers for home and office.",
    image: "images/shop/printer.jpg",
    link: "PASTE_YOUR_SHOPEE_AFFILIATE_LINK_HERE"
  },
  {
    name: "CCTV Security Camera",
    category: "CCTV",
    description: "Security camera for home and business.",
    image: "images/shop/cctv.jpg",
    link: "PASTE_YOUR_SHOPEE_AFFILIATE_LINK_HERE"
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
