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

function isAllowedDomain(unicodeDomain) {
  return config.allowlist.includes(unicodeDomain);
}

function containsMixedScripts(domain) {
  const scripts = new Set();

  for (const char of domain) {
    if (char === "." || char === "-") continue;
    scripts.add(char.script || char.constructor.name);
  }

  return scripts.size > 1;
}

function containsSuspiciousUnicode(domain) {
  const suspiciousChars = /[ıаοе]/u;
  return suspiciousChars.test(domain);
}

api.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = new URL(details.url);
    const unicodeDomain = url.hostname;

    if (isAllowedDomain(unicodeDomain)) {
      return {};
    }

    if (
      containsMixedScripts(unicodeDomain) ||
      containsSuspiciousUnicode(unicodeDomain)
    ) {
      return { cancel: true };
    }

    return {};
  },
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking"]
);
