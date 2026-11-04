
"use strict";

window.GS = window.GS || {};

GS.DB = (() => {
  const DB_NAME = "LinkTechGameScorerV2";
  const STORE = "workspace";
  const KEY = "main";

  let db;

  const defaults = {
    setup: {
      name: "Untitled Tournament",
      sport: "Basketball",
      format: "points",
      date: "",
      venue: "",
      organizer: "",
      duration: "",
      tournamentFormat: "single",
      targetScore: 21,
      bestOf: 3,
      winBy: 2,
      maxScore: 0
    },
    teams: [],
    matches: [],
    champion: null,
    activeMatch: null,
    scoreHistory: [],
    updatedAt: null
  };

  function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = e => {
        const database = e.target.result;

        if (!database.objectStoreNames.contains(STORE)) {
          database.createObjectStore(STORE);
        }
      };

      request.onsuccess = e => {
        db = e.target.result;
        resolve(db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async function load() {
    if (!db) await open();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(KEY);

      request.onsuccess = () => {
        const data = request.result;

        resolve(data ? data : structuredClone(defaults));
      };

      request.onerror = () => reject(request.error);
    });
  }

  async function save(data) {
    if (!db) await open();

    data.updatedAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");

      tx.objectStore(STORE).put(data, KEY);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function clear() {
    if (!db) await open();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");

      tx.objectStore(STORE).delete(KEY);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  return {
    open,
    load,
    save,
    clear,
    defaults
  };
})();
