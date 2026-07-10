const ALARM_NAME = "miniflux-refresh";

/* ---------------- settings ---------------- */

async function getSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get(
      [
        "url",
        "password",          // API token
        "refresh",
        "badgeTextColor",
        "badgeBgColor",
        "openMode",
        "tabMode",
        "instantUpdate"
      ],
      resolve
    );
  });
}

/* ---------------- alarms ---------------- */

async function resetAlarm() {
  const { refresh = 5 } = await getSettings();
  chrome.alarms.clear(ALARM_NAME, () => {
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: Math.max(1, refresh)
    });
  });
}

/* ---------------- badge update ---------------- */

async function updateBadge() {
  const {
    url,
    password,              // API token
    badgeTextColor = "#ffffff",
    badgeBgColor = "#ff6f00"
  } = await getSettings();

  if (!url || !password) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  const apiUrl = url.replace(/\/$/, "") + "/v1/feeds/counters";

  try {
    const resp = await fetch(apiUrl, {
      headers: {
        "X-Auth-Token": password
      }
    });

    if (!resp.ok) {
      throw new Error("HTTP " + resp.status);
    }

    const data = await resp.json();

    // Modern Miniflux counters format:
    // { reads: {id: n, ...}, unreads: {id: n, ...} }
    let unread = 0;
    if (data.unreads && typeof data.unreads === "object") {
      for (const count of Object.values(data.unreads)) {
        unread += Number(count) || 0;
      }
    }

    chrome.action.setBadgeBackgroundColor({ color: badgeBgColor });
    chrome.action.setBadgeTextColor({ color: badgeTextColor });
    chrome.action.setBadgeText({
      text: unread > 0 ? String(unread) : ""
    });

  } catch (err) {
    console.error("Miniflux badge error:", err);
    chrome.action.setBadgeBackgroundColor({ color: "#b00020" });
    chrome.action.setBadgeTextColor({ color: "#ffffff" });
    chrome.action.setBadgeText({ text: "!" });
  }
}

/* ---------------- lifecycle ---------------- */

chrome.runtime.onInstalled.addListener(() => {
  resetAlarm();
  updateBadge();
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM_NAME) {
    updateBadge();
  }
});

chrome.storage.onChanged.addListener(changes => {
  if (changes.refresh) {
    resetAlarm();
  }
});

/* ---------------- click behavior ---------------- */

chrome.action.onClicked.addListener(async () => {
  const {
    url,
    openMode = "unread",
    tabMode = "new",
    instantUpdate = false
  } = await getSettings();

  if (!url) return;

  let path = "/unread";
  if (openMode === "categories") path = "/categories";
  if (openMode === "feeds") path = "/feeds";

  const baseUrl = url.replace(/\/$/, "");
  const targetUrl = baseUrl + path;

  if (tabMode === "focus") {
    const tabs = await chrome.tabs.query({ url: baseUrl + "*" });
    if (tabs.length > 0) {
      chrome.tabs.update(tabs[0].id, { active: true });
      chrome.windows.update(tabs[0].windowId, { focused: true });

      if (instantUpdate) updateBadge();
      return;
    }
  }

  chrome.tabs.create({ url: targetUrl });

  if (instantUpdate) updateBadge();
});
/* ---------------- omnibox search ---------------- */

chrome.omnibox.onInputEntered.addListener(async (text) => {
  if (!text) return;

  const { url } = await getSettings();
  if (!url) return;

  const baseUrl = url.replace(/\/$/, "");
  const searchUrl = baseUrl + "/search?q=" + encodeURIComponent(text);

  chrome.tabs.create({ url: searchUrl });
});

