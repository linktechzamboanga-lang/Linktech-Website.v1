
/* FLITS - Animated Technology Showcase */

(() => {
  "use strict";

  const SITE_URL = "https://www.flitspecialist.com";
  const INTERVAL = 5000;

  const slides = [
    {
      title: "Welcome to FLITS",
      description: "Freelance IT Specialist. Connecting technology with innovative solutions.",
      image: "images/share/home.jpg",
      link: "/",
      button: "Explore FLITS"
    },
    {
      title: "Technology Downloads",
      description: "Discover useful applications, digital tools, and technology resources.",
      image: "images/share/download.jpg",
      link: "/download.html",
      button: "Explore Downloads"
    },
    {
      title: "FLITS Marketplace",
      description: "Explore computer hardware, accessories, and technology products.",
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
      title: "Contact FLITS",
      description: "Need technical assistance? Connect with us today.",
      image: "images/share/contact.jpg",
      link: "/contact.html",
      button: "Contact Us"
    },
    {
      title: "About FLITS",
      description: "Innovative technology solutions for individuals and businesses.",
      image: "images/share/about.jpg",
      link: "/about.html",
      button: "Learn More"
    },
    {
      title: "FLITS Community",
      description: "Connect, learn, and share knowledge with technology enthusiasts.",
      image: "images/share/community.jpg",
      link: "/community.html",
      button: "Join Community"
    }
  ];

  let currentSlide = 0;
  let timer = null;
  let playing = true;

  // REAL-TIME GREETING
  function getGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 18) return "Good afternoon";
    return "Good evening";
  }

  function updateGreeting() {
    document.querySelectorAll(".lt-greeting").forEach(el => {
      el.textContent = `${getGreeting()}! Welcome back here.`;
    });
  }

  function createSlideshow(id) {
    const section = document.createElement("section");
    section.className = "lt-slideshow";
    section.id = id;

    section.innerHTML = `
      <div class="lt-tech-background">
        <span class="lt-tech-orb orb-one"></span>
        <span class="lt-tech-orb orb-two"></span>
        <span class="lt-tech-orb orb-three"></span>
        <div class="lt-tech-grid"></div>
      </div>

      <div class="lt-showcase-heading">
        <span class="lt-brand-label">FLITS • FREELANCE IT SPECIALIST</span>
        <h2 class="lt-greeting"></h2>
        <p>Discover technology. Explore possibilities.</p>
      </div>

      <div class="lt-slide-container"></div>

      <div class="lt-slide-controls">
        <button type="button" data-action="prev" aria-label="Previous">❮</button>
        <button type="button" data-action="toggle">Ⅱ Pause</button>
        <button type="button" data-action="next" aria-label="Next">❯</button>
      </div>

      <div class="lt-slide-dots"></div>

      <div class="lt-share-actions">
        <button class="lt-share-btn" data-share="facebook">Facebook</button>
        <button class="lt-share-btn" data-share="messenger">Messenger</button>
        <button class="lt-share-btn" data-share="native">Share</button>
        <button class="lt-share-btn" data-share="copy">Copy Link</button>
      </div>
    `;

    const container = section.querySelector(".lt-slide-container");
    const dots = section.querySelector(".lt-slide-dots");

    slides.forEach((slide, index) => {
      const item = document.createElement("article");
      item.className = "lt-slide";

      const content = document.createElement("div");
      content.className = "lt-slide-content";

      const image = document.createElement("img");
      image.src = slide.image;
      image.alt = slide.title;
      image.loading = "lazy";

      image.onerror = () => {
        image.style.display = "none";
      };

      const category = document.createElement("span");
      category.className = "lt-slide-tag";
      category.textContent = "FLITS TECHNOLOGY";

      const heading = document.createElement("h2");
      heading.textContent = slide.title;

      const description = document.createElement("p");
      description.textContent = slide.description;

      const link = document.createElement("a");
      link.className = "lt-slide-link";
      link.href = slide.link;
      link.textContent = slide.button;

      content.append(image, category, heading, description, link);
      item.appendChild(content);
      container.appendChild(item);

      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "lt-slide-dot";
      dot.setAttribute("aria-label", `Go to slide ${index + 1}`);

      dot.addEventListener("click", () => {
        showSlide(index);
        restartTimer();
      });

      dots.appendChild(dot);
    });

    section.addEventListener("click", event => {
      const action = event.target.closest("[data-action]");
      const share = event.target.closest("[data-share]");

      if (action) {
        if (action.dataset.action === "prev") {
          showSlide(currentSlide - 1);
          restartTimer();
        }

        if (action.dataset.action === "next") {
          showSlide(currentSlide + 1);
          restartTimer();
        }

        if (action.dataset.action === "toggle") {
          togglePlayback(action);
        }
      }

      if (share) handleShare(share.dataset.share);
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
    }, INTERVAL);
  }

  function restartTimer() {
    if (playing) startSlideshow();
  }

  function togglePlayback(button) {
    playing = !playing;

    button.textContent = playing ? "Ⅱ Pause" : "▶ Play";

    if (playing) {
      startSlideshow();
    } else {
      clearInterval(timer);
    }
  }

  async function handleShare(type) {
    const title = "FLITS - Freelance IT Specialist";
    const url = SITE_URL;

    if (type === "facebook") {
      window.open(
        "https://www.facebook.com/sharer/sharer.php?u=" +
        encodeURIComponent(url),
        "_blank",
        "noopener,noreferrer"
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
        alert("FLITS website link copied!");
      } catch {
        prompt("Copy FLITS website link:", url);
      }
      return;
    }

    if (type === "native") {
      if (navigator.share) {
        try {
          await navigator.share({
            title,
            text: "Explore FLITS Freelance IT Specialist!",
            url
          });
        } catch (error) {
          if (error.name !== "AbortError") {
            alert("Unable to share. Please copy the website link.");
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
    updateGreeting();

    // Update greeting every minute.
    setInterval(updateGreeting, 60000);

    const homeTarget = document.getElementById("lt-home-slideshow");

    if (homeTarget) {
      homeTarget.appendChild(
        createSlideshow("lt-home-showcase")
      );
    }

    // Floating showcase button.
    const floatingButton = document.createElement("button");
    floatingButton.type = "button";
    floatingButton.className = "lt-floating-share";
    floatingButton.textContent = "Explore FLITS";

    const overlay = document.createElement("div");
    overlay.className = "lt-slideshow-overlay";
    overlay.id = "lt-share-overlay";

    const modal = createSlideshow("lt-floating-showcase");

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "lt-close-slideshow";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close showcase");

    modal.insertBefore(closeButton, modal.firstChild);
    overlay.appendChild(modal);

    document.body.append(floatingButton, overlay);

    floatingButton.addEventListener("click", () => {
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      showSlide(currentSlide);
    });

    function closeOverlay() {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    }

    closeButton.addEventListener("click", closeOverlay);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeOverlay();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeOverlay();
    });

    showSlide(0);
    startSlideshow();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
