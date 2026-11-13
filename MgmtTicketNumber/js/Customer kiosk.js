
/*
 * LinkTech Ticket Number
 * Customer Kiosk JavaScript
 *
 * File: js/customer-kiosk.js
 *
 * Required API actions in Code.gs:
 *   issueCustomerTicket
 *
 * Expected request:
 *   {
 *     roomId: "ROOM_ID",
 *     category: "Payment",
 *     categoryCode: "PAY"
 *   }
 *
 * Expected response example:
 *   {
 *     ok: true,
 *     ticket: {
 *       id: "...",
 *       number: 25,
 *       category: "Payment",
 *       categoryCode: "PAY",
 *       categoryNumber: 1,
 *       displayNumber: "PAY-001",
 *       createdAt: "..."
 *     }
 *   }
 *
 * This file uses the existing LT.api() connection wrapper.
 */

(() => {
  "use strict";

  // --------------------------------------------------
  // 1. CONFIGURATION
  // --------------------------------------------------

  const KIOSK_CONFIG = {
    appName: "LinkTech Ticket Number",
    apiAction: "issueCustomerTicket",
    timeZone: "Asia/Manila",
    ticketDigits: 3,

    categories: [
      {
        name: "Payment",
        code: "PAY",
        description: "Bills and other payments",
        icon: "💳"
      },
      {
        name: "Deposit",
        code: "DEP",
        description: "Cash or account deposit",
        icon: "💰"
      },
      {
        name: "Withdrawal",
        code: "WDL",
        description: "Cash withdrawal",
        icon: "🏦"
      },
      {
        name: "Releasing",
        code: "REL",
        description: "Releasing of documents or items",
        icon: "📄"
      },
      {
        name: "Complaint",
        code: "CMP",
        description: "Submit a complaint",
        icon: "📝"
      },
      {
        name: "Other Concern",
        code: "OTH",
        description: "Other transactions or inquiries",
        icon: "❓"
      }
    ]
  };

  // --------------------------------------------------
  // 2. GET ROOM ID FROM URL
  // --------------------------------------------------

  const urlParams = new URLSearchParams(window.location.search);

  const ROOM_ID =
    urlParams.get("kiosk") ||
    urlParams.get("room") ||
    urlParams.get("roomId") ||
    "";

  // --------------------------------------------------
  // 3. ELEMENT REFERENCES
  // --------------------------------------------------

  const elements = {
    roomName: document.getElementById("kioskRoomName"),
    status: document.getElementById("kioskStatus"),
    categories: document.getElementById("categoryGrid"),
    submit: document.getElementById("kioskSubmit"),
    result: document.getElementById("ticketResult"),
    ticketNumber: document.getElementById("ticketNumber"),
    ticketCategory: document.getElementById("ticketCategory"),
    ticketDate: document.getElementById("ticketDate"),
    print: document.getElementById("ticketPrint"),
    newTicket: document.getElementById("ticketNew")
  };

  // --------------------------------------------------
  // 4. KIOSK STATE
  // --------------------------------------------------

  let selectedCategory = null;
  let currentTicket = null;
  let isSubmitting = false;

  // --------------------------------------------------
  // 5. HELPER FUNCTIONS
  // --------------------------------------------------

  function setStatus(message, type = "info") {
    if (!elements.status) return;

    elements.status.textContent = message;
    elements.status.dataset.type = type;
  }

  function setSubmitting(value) {
    isSubmitting = value;

    if (elements.submit) {
      elements.submit.disabled = value;
      elements.submit.textContent = value
        ? "Generating your ticket..."
        : "GET MY TICKET";
    }

    if (elements.categories) {
      elements.categories
        .querySelectorAll("button")
        .forEach(button => {
          button.disabled = value;
        });
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
      const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return replacements[character];
    });
  }

  function formatTicketNumber(ticket) {
    // Prefer the display number returned by Code.gs.
    if (ticket.displayNumber) {
      return String(ticket.displayNumber);
    }

    const code =
      ticket.categoryCode ||
      (selectedCategory && selectedCategory.code) ||
      "GEN";

    const categoryNumber = Number(
      ticket.categoryNumber ?? ticket.number ?? 0
    );

    return (
      code +
      "-" +
      String(categoryNumber).padStart(
        KIOSK_CONFIG.ticketDigits,
        "0"
      )
    );
  }

  function formatDate(value) {
    const date = value ? new Date(value) : new Date();

    if (Number.isNaN(date.getTime())) {
      return new Date().toLocaleString("en-PH", {
        timeZone: KIOSK_CONFIG.timeZone
      });
    }

    return date.toLocaleString("en-PH", {
      timeZone: KIOSK_CONFIG.timeZone,
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }

  function extractTicket(response) {
    /*
     * Supports common response structures:
     * response.ticket
     * response.data.ticket
     * response.result.ticket
     * response itself
     *
     * LT.api() may already unwrap response.result.data.
     */

    if (!response) return null;

    if (response.ticket) {
      return response.ticket;
    }

    if (response.data && response.data.ticket) {
      return response.data.ticket;
    }

    if (response.result && response.result.ticket) {
      return response.result.ticket;
    }

    if (response.id || response.number || response.displayNumber) {
      return response;
    }

    return null;
  }

  // --------------------------------------------------
  // 6. CREATE CATEGORY BUTTONS
  // --------------------------------------------------

  function renderCategories() {
    if (!elements.categories) {
      console.error("Missing #categoryGrid in kiosk HTML.");
      return;
    }

    elements.categories.innerHTML = "";

    KIOSK_CONFIG.categories.forEach(category => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "kiosk-category";
      button.dataset.code = category.code;

      button.innerHTML = `
        <span class="kiosk-category-icon">
          ${category.icon}
        </span>

        <span class="kiosk-category-name">
          ${escapeHTML(category.name)}
        </span>

        <span class="kiosk-category-description">
          ${escapeHTML(category.description)}
        </span>
      `;

      button.addEventListener("click", () => {
        selectCategory(category);
      });

      elements.categories.appendChild(button);
    });
  }

  // --------------------------------------------------
  // 7. SELECT CATEGORY
  // --------------------------------------------------

  function selectCategory(category) {
    if (isSubmitting) return;

    selectedCategory = category;

    if (elements.categories) {
      elements.categories
        .querySelectorAll(".kiosk-category")
        .forEach(button => {
          button.classList.toggle(
            "selected",
            button.dataset.code === category.code
          );
        });
    }

    if (elements.submit) {
      elements.submit.disabled = false;
    }

    setStatus(
      `${category.name} selected. Tap GET MY TICKET to continue.`,
      "success"
    );
  }

  // --------------------------------------------------
  // 8. REQUEST CUSTOMER TICKET
  // --------------------------------------------------

  async function issueCustomerTicket() {
    if (isSubmitting) return;

    if (!ROOM_ID) {
      setStatus(
        "Room ID is missing. Please use the correct kiosk link.",
        "error"
      );
      return;
    }

    if (!selectedCategory) {
      setStatus(
        "Please select your transaction purpose first.",
        "warning"
      );
      return;
    }

    if (!window.LT || typeof window.LT.api !== "function") {
      setStatus(
        "Connection system is not loaded. Please refresh this page.",
        "error"
      );
      console.error("LT.api() is not available.");
      return;
    }

    setSubmitting(true);
    setStatus("Connecting to the ticket server...", "info");

    try {
      const requestData = {
        roomId: ROOM_ID,
        category: selectedCategory.name,
        categoryCode: selectedCategory.code
      };

      const response = await window.LT.api(
        KIOSK_CONFIG.apiAction,
        requestData
      );

      const ticket = extractTicket(response);

      if (!ticket) {
        throw new Error(
          response && response.message
            ? response.message
            : "The server did not return a valid ticket."
        );
      }

      currentTicket = {
        ...ticket,
        category: ticket.category || selectedCategory.name,
        categoryCode:
          ticket.categoryCode || selectedCategory.code
      };

      showTicket(currentTicket);

      setStatus(
        "Your ticket has been generated. Please print it.",
        "success"
      );

    } catch (error) {
      console.error("Customer ticket error:", error);

      setStatus(
        error && error.message
          ? error.message
          : "Unable to generate your ticket. Please try again.",
        "error"
      );

    } finally {
      setSubmitting(false);
    }
  }

  // --------------------------------------------------
  // 9. DISPLAY GENERATED TICKET
  // --------------------------------------------------

  function showTicket(ticket) {
    if (!elements.result) {
      console.error("Missing #ticketResult in kiosk HTML.");
      return;
    }

    const displayNumber = formatTicketNumber(ticket);
    const categoryName =
      ticket.category || selectedCategory.name;

    const ticketDate = formatDate(
      ticket.createdAt || ticket.timestamp
    );

    if (elements.ticketNumber) {
      elements.ticketNumber.textContent = displayNumber;
    }

    if (elements.ticketCategory) {
      elements.ticketCategory.textContent = categoryName;
    }

    if (elements.ticketDate) {
      elements.ticketDate.textContent = ticketDate;
    }

    elements.result.classList.remove("hidden");

    // Hide the category selection after ticket generation.
    if (elements.categories) {
      elements.categories.classList.add("hidden");
    }

    if (elements.submit) {
      elements.submit.classList.add("hidden");
    }

    // Keep the result visible.
    elements.result.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  // --------------------------------------------------
  // 10. CREATE PRINT AREA
  // --------------------------------------------------

  function getPrintArea() {
    let printArea = document.getElementById(
      "customerKioskPrint"
    );

    if (!printArea) {
      printArea = document.createElement("section");
      printArea.id = "customerKioskPrint";
      printArea.className = "customer-kiosk-print";

      document.body.appendChild(printArea);
    }

    return printArea;
  }

  function buildPrintableTicket(ticket) {
    const displayNumber = formatTicketNumber(ticket);

    const categoryName =
      ticket.category || "General";

    const dateText = formatDate(
      ticket.createdAt || ticket.timestamp
    );

    const printArea = getPrintArea();

    printArea.innerHTML = `
      <div class="customer-ticket-paper">

        <div class="customer-ticket-header">
          <h2>LINKTECH</h2>
          <p>Ticket Number</p>
        </div>

        <div class="customer-ticket-divider"></div>

        <div class="customer-ticket-purpose">
          TRANSACTION PURPOSE
        </div>

        <h3 class="customer-ticket-category">
          ${escapeHTML(categoryName)}
        </h3>

        <div class="customer-ticket-number">
          ${escapeHTML(displayNumber)}
        </div>

        <p class="customer-ticket-date">
          ${escapeHTML(dateText)}
        </p>

        <div class="customer-ticket-divider"></div>

        <p class="customer-ticket-instruction">
          Please wait for your ticket number to be called.
        </p>

        <p class="customer-ticket-footer">
          Thank you for choosing our service.
        </p>

      </div>
    `;

    return printArea;
  }

  // --------------------------------------------------
  // 11. PRINT TICKET
  // --------------------------------------------------

  function printTicket() {
    if (!currentTicket) {
      setStatus("No ticket is available to print.", "error");
      return;
    }

    buildPrintableTicket(currentTicket);

    /*
     * Printing is started only after the customer taps
     * the Print Ticket button. This avoids relying on
     * automatic or silent printing.
     */

    document.body.classList.add("kiosk-printing");

    const cleanup = () => {
      document.body.classList.remove("kiosk-printing");
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);

    window.print();

    // Fallback cleanup for browsers that do not fire afterprint.
    setTimeout(cleanup, 3000);
  }

  // --------------------------------------------------
  // 12. START ANOTHER CUSTOMER TRANSACTION
  // --------------------------------------------------

  function startNewTicket() {
    if (isSubmitting) return;

    currentTicket = null;
    selectedCategory = null;

    if (elements.result) {
      elements.result.classList.add("hidden");
    }

    if (elements.categories) {
      elements.categories.classList.remove("hidden");

      elements.categories
        .querySelectorAll(".kiosk-category")
        .forEach(button => {
          button.classList.remove("selected");
        });
    }

    if (elements.submit) {
      elements.submit.classList.remove("hidden");
      elements.submit.disabled = true;
      elements.submit.textContent = "GET MY TICKET";
    }

    setStatus(
      "Please select your transaction purpose.",
      "info"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // --------------------------------------------------
  // 13. INITIALIZE KIOSK
  // --------------------------------------------------

  function initializeKiosk() {
    if (elements.roomName) {
      elements.roomName.textContent =
        "Customer Ticket Kiosk";
    }

    if (!ROOM_ID) {
      setStatus(
        "Invalid kiosk link. The room ID is missing.",
        "error"
      );

      if (elements.submit) {
        elements.submit.disabled = true;
      }

      if (elements.categories) {
        elements.categories.innerHTML = "";
      }

      return;
    }

    renderCategories();

    if (elements.submit) {
      elements.submit.disabled = true;

      elements.submit.addEventListener(
        "click",
        issueCustomerTicket
      );
    }

    if (elements.print) {
      elements.print.addEventListener(
        "click",
        printTicket
      );
    }

    if (elements.newTicket) {
      elements.newTicket.addEventListener(
        "click",
        startNewTicket
      );
    }

    setStatus(
      "Please select your transaction purpose.",
      "info"
    );

    console.log("LinkTech Customer Kiosk initialized.");
    console.log("Room ID:", ROOM_ID);
  }

  // --------------------------------------------------
  // 14. START WHEN PAGE IS READY
  // --------------------------------------------------

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeKiosk
    );
  } else {
    initializeKiosk();
  }

  // Optional access for testing and debugging.
  window.LinkTechCustomerKiosk = {
    issueCustomerTicket,
    printTicket,
    startNewTicket,
    getRoomId: () => ROOM_ID
  };

})();
