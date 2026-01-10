const api = typeof browser !== "undefined" ? browser : chrome;

/* ---------------------------
   Policy-gesteuerte Sprache
----------------------------*/

// Beispiel: von Enterprise Policy / Storage
const policyLanguage = null; // z.B. "de", "en", "fr"

/* ---------------------------
   i18n Helper
----------------------------*/

function getUILanguage() {
  return (
    policyLanguage ||
    api.i18n.getUILanguage?.() ||
    navigator.language ||
    "en"
  ).split("-")[0];
}

function t(key) {
  const msg = api.i18n.getMessage(key);
  if (msg) return msg;

  // Hard fallback (sollte nie greifen, aber sicher)
  const fallback = {
    title: "Potential phishing domain detected",
    intro: "This website uses Unicode characters that may be used for visual deception.",
    domainLabel: "Domain",
    reasonLabel: "Reason",
    cancel: "Cancel",
    proceed: "Proceed anyway",
    footer: "Legitimate websites typically do not use visually similar Unicode characters."
  };

  return fallback[key] || key;
}

/* ---------------------------
   Apply translations
----------------------------*/

document.documentElement.lang = getUILanguage();

document.querySelectorAll("[data-i18n]").forEach(el => {
  const key = el.getAttribute("data-i18n");
  const text = t(key);
  el.textContent = text;

  if (el.hasAttribute("aria-label")) {
    el.setAttribute("aria-label", text);
  }
});

/* ---------------------------
   Populate domain + reasons
----------------------------*/

const params = new URLSearchParams(window.location.search);
const targetUrl = params.get("target");

const domainEl = document.getElementById("domain");
const reasonsEl = document.getElementById("reasons");

if (targetUrl) {
  try {
    const url = new URL(targetUrl);
    domainEl.textContent = url.hostname;

    const reasons = [];

    if (url.hostname.includes("xn--")) {
      reasons.push(t("reasonPunycode"));
    }

    if (/[ıаοе]/u.test(url.hostname)) {
      reasons.push(t("reasonLookalike"));
    }

    if (!reasons.length) {
      reasons.push(t("reasonGeneric"));
    }

    reasons.forEach(r => {
      const li = document.createElement("li");
      li.textContent = r;
      reasonsEl.appendChild(li);
    });

  } catch {
    domainEl.textContent = "—";
  }
}

/* ---------------------------
   Actions
----------------------------*/

document.getElementById("cancel").addEventListener("click", () => {
  window.close();
});

document.getElementById("proceed").addEventListener("click", () => {
  api.runtime.sendMessage({
    type: "ALLOW_ONCE",
    url: targetUrl
  });
});
