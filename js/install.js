(() => {
  let installEvent = null;

  const prompt = document.getElementById('ltInstallPrompt');
  const installBtn = document.getElementById('ltInstallButton');
  const closeBtn = document.getElementById('ltInstallClose');

  if (!prompt || !installBtn || !closeBtn) return;

  // Register existing service worker.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .catch(error => console.error(
          'LinkTech service worker:', error
        ));
    });
  }

  // Receive browser installation permission.
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installEvent = event;

    if (!localStorage.getItem('ltInstallDismissed')) {
      prompt.style.display = 'block';
    }
  });

  // Install application.
  installBtn.addEventListener('click', async () => {
    if (!installEvent) return;

    installEvent.prompt();

    const result = await installEvent.userChoice;

    if (result.outcome === 'accepted') {
      prompt.style.display = 'none';
    }

    installEvent = null;
  });

  // Close installation prompt.
  closeBtn.addEventListener('click', () => {
    prompt.style.display = 'none';
    localStorage.setItem('ltInstallDismissed', 'yes');
  });

  // Hide prompt after successful installation.
  window.addEventListener('appinstalled', () => {
    prompt.style.display = 'none';
    installEvent = null;
  });
})();
