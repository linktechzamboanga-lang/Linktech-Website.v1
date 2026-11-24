
(() => {
  "use strict";

  // FLITS VIDEO AD CONFIGURATION
  const CONFIG = {
    // Official Google IMA sample tag for testing only.
    // Replace with your approved production VAST ad tag.
    adTagUrl:
      "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&correlator=",

    width: 640,
    height: 360
  };

  const video = document.getElementById("flitsContentVideo");
  const adContainer = document.getElementById("flitsAdContainer");
  const player = document.getElementById("flitsVideoPlayer");
  const startButton = document.getElementById("flitsAdStart");
  const loading = document.getElementById("flitsAdLoading");
  const status = document.getElementById("flitsAdStatus");

  if (!video || !adContainer || !startButton) return;

  let adsLoader;
  let adsManager;
  let adDisplayContainer;
  let adRequested = false;
  let adPlaying = false;

  function setStatus(message) {
    status.textContent = message;
  }

  function setLoading(show) {
    loading.hidden = !show;
  }

  function playContent() {
    adPlaying = false;
    setLoading(false);
    setStatus("Playing content");
    video.style.display = "block";

    if (!video.currentSrc || !video.querySelector("source")?.src ||
        video.querySelector("source").src.includes("YOUR_CONTENT_VIDEO_URL")) {
      setStatus("Add your content video URL");
      return;
    }

    video.play().catch(() => {
      setStatus("Press play to watch content");
    });
  }

  function resizeAds() {
    if (!adsManager) return;

    const rect = player.getBoundingClientRect();

    adsManager.resize(
      Math.round(rect.width),
      Math.round(rect.height),
      google.ima.ViewMode.NORMAL
    );
  }

  function initializeIMA() {
    if (!window.google || !google.ima) {
      setStatus("Video ad SDK unavailable");
      return;
    }

    adDisplayContainer = new google.ima.AdDisplayContainer(
      adContainer,
      video
    );

    adsLoader = new google.ima.AdsLoader(adDisplayContainer);

    adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded
    );

    adsLoader.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError
    );

    video.addEventListener("ended", () => {
      if (!adPlaying && adsLoader) {
        adsLoader.contentComplete();
      }
    });
  }

  function requestAds() {
    if (adRequested) return;

    adRequested = true;
    setLoading(true);
    setStatus("Requesting advertisement");

    const request = new google.ima.AdsRequest();

    request.adTagUrl = CONFIG.adTagUrl;

    const rect = player.getBoundingClientRect();

    request.linearAdSlotWidth = Math.max(1, Math.round(rect.width));
    request.linearAdSlotHeight = Math.max(1, Math.round(rect.height));

    request.nonLinearAdSlotWidth = Math.round(rect.width);
    request.nonLinearAdSlotHeight = Math.round(rect.height / 3);

    request.setAdWillAutoPlay(false);
    request.setAdWillPlayMuted(false);

    adsLoader.requestAds(request);
  }

  function onAdsManagerLoaded(event) {
    try {
      adsManager = event.getAdsManager(video);

      adsManager.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR,
        onAdError
      );

      adsManager.addEventListener(
        google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
        () => {
          adPlaying = true;
          video.pause();
          video.style.display = "none";
          setLoading(false);
          setStatus("Advertisement playing");
        }
      );

      adsManager.addEventListener(
        google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
        playContent
      );

      adsManager.addEventListener(
        google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
        () => {
          adPlaying = false;
          setStatus("Advertisement completed");
        }
      );

      adsManager.addEventListener(
        google.ima.AdEvent.Type.STARTED,
        () => {
          setStatus("Advertisement playing");
        }
      );

      adsManager.addEventListener(
        google.ima.AdEvent.Type.COMPLETE,
        () => {
          setStatus("Advertisement completed");
        }
      );

      const rect = player.getBoundingClientRect();

      adsManager.init(
        Math.round(rect.width),
        Math.round(rect.height),
        google.ima.ViewMode.NORMAL
      );

      adsManager.start();

    } catch (error) {
      console.error("FLITS Ads Manager:", error);
      onAdError();
    }
  }

  function onAdError(error) {
    console.warn("FLITS video ad error:", error);

    if (adsManager) {
      adsManager.destroy();
      adsManager = null;
    }

    setLoading(false);
    setStatus("No advertisement available");

    // Continue with content instead of blocking the visitor.
    playContent();
  }

  startButton.addEventListener("click", () => {
    startButton.hidden = true;

    if (!window.google || !google.ima) {
      setStatus("Unable to load video advertising SDK");
      playContent();
      return;
    }

    try {
      adDisplayContainer.initialize();
      requestAds();
    } catch (error) {
      console.error(error);
      playContent();
    }
  });

  window.addEventListener("resize", resizeAds);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && adsManager) {
      // Do not force playback while the page is hidden.
      // The IMA player retains control of its ad session.
    }
  });

  initializeIMA();
})();
