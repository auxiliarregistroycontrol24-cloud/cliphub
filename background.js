chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Manejador del panel lateral
  if (msg.action === 'openSidePanel') {
    if (chrome.sidePanel) {
      chrome.sidePanel.open({ windowId: sender.tab?.windowId })
        .then(() => sendResponse({ ok: true }))
        .catch(() => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.sidePanel.open({ tabId: tabs[0].id })
                .then(() => sendResponse({ ok: true }))
                .catch(err => sendResponse({ ok: false, err: err.message }));
            }
          });
        });
      return true;
    }
  }

  // Manejador de Quick Links
  if (msg.action === 'openLinks') {
    const urls = msg.urls || [];
    urls.forEach(url => {
      if (url) chrome.tabs.create({ url, active: false });
    });
    sendResponse({ ok: true });
    return true;
  }

  // NUEVO: Manejador para Automatización (Batch click de enlaces)
  if (msg.action === "OPEN_BACKGROUND_TAB") {
    chrome.tabs.create({ url: msg.url, active: false }, (tab) => {
      sendResponse({ status: "tab_opened", tabId: tab.id });
    });
    return true; 
  }
});