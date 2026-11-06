/* LinkTech Website Sharing & Slideshow */

(() => {
  "use strict";

  const SITE_URL = "https://lintechzamboanga.solutions";

  // Update these image paths and page links to match your actual website.
  const slides = [
    {
      title: "Welcome to LinkTech Zamboanga",
      description: "Your Freelance IT Specialist for innovative technology solutions.",
      image: "images/share/home.jpg",
      link: "/",
      button: "Explore Homepage"
    },
    {
      title: "LinkTech Downloads",
      description: "Discover useful applications, tools, and technology downloads.",
      image: "images/share/download.jpg",
      link: "/download.html",
      button: "Explore Downloads"
    },
    {
      title: "LinkTech Marketplace",
      description: "Buy and sell computer hardware and software products.",
      image: "images/share/shop.jpg",
      link: "/shop.html",
      button: "Visit Marketplace"
    },
    {
      title: "IT Services",
      description: "Computer repair, laptop upgrades, networking, CCTV, and technical support.",
      image: "images/share/services.jpg",
      link: "/services.html",
      button: "View Services"
    },
    {
      title: "Contact LinkTech",
      description: "Connect with LinkTech for assistance and technical inquiries.",
      image: "images/share/contact.jpg",
      link: "/contact.html",
      button: "Contact Us"
    },
    {
      title: "About LinkTech",
      description: "Learn more about our IT services and technology solutions.",
      image: "images/share/about.jpg",
      link: "/about.html",
      button: "Learn More"
    },
    {
      title: "LinkTech IT Community",
      description: "Connect, learn, and share technology knowledge with the community.",
      image: "images/share/community.jpg",
      link: "/community.html",
      button: "Join Community"
    }
  ];

  const intervalTime = 5000;
  let currentSlide = 0;
  let timer = null;
  let playing = true;

  function createSlideshow(id) {
    const section = document.createElement("section");
    section.className = "lt-slideshow";
    section.id = id;

    section.innerHTML = `
      <div class="lt-slide-container"></div>

      <div class="lt-slide-controls">
        <button type="button" data-action="prev">❮ Previous</button>
        <button type="button" data-action="toggle">Ⅱ Pause</button>
        <button type="button" data-action="next">Next ❯</button>
      </div>

      <div class="lt-slide-dots"></div>

      <div class="lt-share-actions">
        <button type="button" class="lt-share-btn lt-facebook-share"
          data-share="facebook">Share on Facebook</button>

        <button type="button" class="lt-share-btn lt-messenger-share"
          data-share="messenger">Message LinkTech</button>

        <button type="button" class="lt-share-btn"
          data-share="native">Share Website</button>

        <button type="button" class="lt-share-btn"
          data-share="copy">Copy Website Link</button>
      </div>
    `;

    const container = section.querySelector(".lt-slide-container");
    const dots = section.querySelector(".lt-slide-dots");

    slides.forEach((slide, index) => {
      const item = document.createElement("article");
      item.className = "lt-slide";

      const content = document.createElement("div");
      content.className = "lt-slide-content";

      const img = document.createElement("img");
      img.src = slide.image;
      img.alt = slide.title;
      img.loading = "lazy";
      img.onerror = () => {
        img.style.display = "none";
      };

      const heading = document.createElement("h2");
      heading.textContent = slide.title;

      const description = document.createElement("p");
      description.textContent = slide.description;

      const link = document.createElement("a");
      link.className = "lt-slide-link";
      link.href = slide.link;
      link.textContent = slide.button;

      content.append(img, heading, description, link);
      item.appendChild(content);
      container.appendChild(item);

      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "lt-slide-dot";
      dot.setAttribute("aria-label", "Go to slide " + (index + 1));
      dot.addEventListener("click", () => showSlide(index));
      dots.appendChild(dot);
    });

    section.addEventListener("click", event => {
      const action = event.target.closest("[data-action]");
      const share = event.target.closest("[data-share]");

      if (action) {
        const type = action.dataset.action;

        if (type === "prev") showSlide(currentSlide - 1);
        if (type === "next") showSlide(currentSlide + 1);
        if (type === "toggle") togglePlayback(action);
      }

      if (share) {
        handleShare(share.dataset.share);
      }
    });

    return section;
  }

  function showSlide(index) {
    currentSlide = (index + slides.length) % slides.length;

    document.querySelectorAll(".lt-slideshow").forEach(section => {
      section.querySelectorAll(".lt-slide").forEach((slide, i) => {
        slide.classList.toggle("active", i === currentSlide);
      });

      section.querySelectorAll(".lt-slide-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === currentSlide);
      });
    });
  }

  function startSlideshow() {
    clearInterval(timer);
    if (!playing) return;

    timer = setInterval(() => {
      showSlide(currentSlide + 1);
    }, intervalTime);
  }

  function togglePlayback(button) {
    playing = !playing;

    if (playing) {
      button.textContent = "Ⅱ Pause";
      startSlideshow();
    } else {
      clearInterval(timer);
      button.textContent = "▶ Play";
    }
  }

  async function handleShare(type) {
    const title = "LinkTech Freelance IT Specialist Zamboanga";
    const url = SITE_URL;

    if (type === "facebook") {
      const facebookUrl =
        "https://www.facebook.com/sharer/sharer.php?u=" +
        encodeURIComponent(url);

      window.open(
        facebookUrl,
        "_blank",
        "noopener,noreferrer,width=650,height=550"
      );
      return;
    }

    if (type === "messenger") {
      window.open(
        "https://m.me/1457107400808526",
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    if (type === "copy") {
      try {
        await navigator.clipboard.writeText(url);
        alert("LinkTech website link copied!");
      } catch {
        prompt("Copy LinkTech website link:", url);
      }
      return;
    }

    if (type === "native") {
      if (navigator.share) {
        try {
          await navigator.share({
            title,
            text: "Explore LinkTech Zamboanga!",
            url
          });
        } catch (error) {
          if (error.name !== "AbortError") {
            alert("Unable to share. Please copy the website link instead.");
          }
        }
      } else {
        window.open(
          "https://www.facebook.com/sharer/sharer.php?u=" +
          encodeURIComponent(url),
          "_blank",
          "noopener,noreferrer"
        );
      }
    }
  }

  function initialize() {
    // Homepage slideshow: add <div id="lt-home-slideshow"></div>
    const homeTarget = document.getElementById("lt-home-slideshow");

    if (homeTarget) {
      homeTarget.appendChild(createSlideshow("lt-home-showcase"));
    }

    // Floating slideshow button on all pages.
    const floatingButton = document.createElement("button");
    floatingButton.type = "button";
    floatingButton.className = "lt-floating-share";
    floatingButton.textContent = "Explore & Share";
    floatingButton.setAttribute("aria-label", "Open LinkTech slideshow");

    // Full-screen slideshow overlay.
    const overlay = document.createElement("div");
    overlay.className = "lt-slideshow-overlay";
    overlay.id = "lt-share-overlay";

    const modal = createSlideshow("lt-floating-showcase");

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "lt-close-slideshow";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close slideshow");

    modal.insertBefore(closeButton, modal.firstChild);
    overlay.appendChild(modal);

    document.body.append(floatingButton, overlay);

    floatingButton.addEventListener("click", () => {
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      showSlide(currentSlide);
    });

    closeButton.addEventListener("click", closeOverlay);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeOverlay();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeOverlay();
    });

    function closeOverlay() {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    }

    showSlide(0);
    startSlideshow();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
