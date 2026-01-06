const params = new URLSearchParams(window.location.search);
const targetUrl = params.get("target");

const domainEl = document.getElementById("domain");
const reasonsEl = document.getElementById("reasons");

if (targetUrl) {
  try {
    const url = new URL(targetUrl);
    domainEl.textContent = url.hostname;

    // Beispiel-Gründe (normalerweise aus Background übergeben)
    const reasons = [];

    if (url.hostname.includes("xn--")) {
      reasons.push("Domain verwendet Punycode (IDN)");
    }

    if (/[ıаοе]/u.test(url.hostname)) {
      reasons.push("Unicode-Zeichen ähneln lateinischen Buchstaben");
    }

    if (!reasons.length) {
      reasons.push("Ungewöhnliche Unicode-Struktur erkannt");
    }

    for (const reason of reasons) {
      const li = document.createElement("li");
      li.textContent = reason;
      reasonsEl.appendChild(li);
    }
  } catch {
    domainEl.textContent = "Unbekannt";
  }
}

document.getElementById("cancel").addEventListener("click", () => {
  window.close();
});

document.getElementById("proceed").addEventListener("click", () => {
  if (!targetUrl) return;

  // Temporär fortfahren (Session-Entscheidung)
  chrome.tabs.getCurrent((tab) => {
    chrome.runtime.sendMessage({
      type: "ALLOW_ONCE",
      url: targetUrl,
      tabId: tab.id
    });
  });
});
