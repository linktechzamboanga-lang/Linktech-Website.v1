
(() => {
  const GA_ID = "G-XXXXXXXXXX";

  // Initialize Google Analytics
  if (!/^G-[A-Z0-9]+$/.test(GA_ID)) {
    console.warn("Set your actual GA4 Measurement ID.");
    return;
  }

  window.dataLayer = window.dataLayer || [];

  function gtag() {
    dataLayer.push(arguments);
  }

  window.gtag = gtag;

  gtag('js', new Date());

  gtag('config', GA_ID, {
    send_page_view: true
  });

  // Load Google Analytics
  const script = document.createElement('script');
  script.async = true;
  script.src =
    'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;

  document.head.appendChild(script);
})();

// Record customer lead events
function recordFlitsLead(category = "general") {
  if (typeof gtag === "function") {
    gtag('event', 'generate_lead', {
      lead_category: category,
      page_location: location.href
    });
  }
}

// Track contact clicks
function trackFlitsContact(method) {
  if (typeof gtag === "function") {
    gtag('event', 'contact_click', {
      contact_method: method
    });
  }
}

// Refresh dashboard display
function refreshFlitsAnalytics() {
  const button = document.querySelector(
    '.analytics-actions button'
  );

  if (button) {
    button.textContent = "Tracking status refreshed";
    setTimeout(() => {
      button.textContent = "Refresh";
    }, 2000);
  }
}
