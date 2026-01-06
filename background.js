// WebExtension-kompatibler API-Zugriff
const api = typeof browser !== "undefined" ? browser : chrome;

/**
 * Prüft, ob eine URL Punycode enthält
 */
function isPunycodeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("xn--");
  } catch {
    return false;
  }
}

/**
 * Setzt oder entfernt die Warnung
 */
function updateWarning(tabId, url) {
  if (!url || !url.startsWith("http")) {
    clearWarning(tabId);
    return;
  }

  if (isPunycodeUrl(url)) {
    api.action.setBadgeText({
      tabId,
      text: "PUNY"
    });

    api.action.setBadgeBackgroundColor({
      tabId,
      color: "#b00020"
    });

    api.action.setTitle({
      tabId,
      title: "⚠️ Achtung: Diese Domain verwendet Punycode (IDN)"
    });
  } else {
    clearWarning(tabId);
  }
}

/**
 * Entfernt Warnung
 */
function clearWarning(tabId) {
  api.action.setBadgeText({
    tabId,
    text: ""
  });

  api.action.setTitle({
    tabId,
    title: "Keine Punycode-Domain erkannt"
  });
}

/**
 * Event: URL ändert sich
 */
api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    updateWarning(tabId, tab.url);
  }
});

/**
 * Event: Tab gewechselt
 */
api.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await api.tabs.get(tabId);
    updateWarning(tabId, tab.url);
  } catch {
    // Tab evtl. nicht verfügbar
  }
});
