const fields = [
  "url",
  "password",
  "refresh",
  "badgeTextColor",
  "badgeBgColor",
  "openMode",
  "tabMode",
  "instantUpdate"
];

chrome.storage.sync.get(fields, data => {
  document.getElementById("url").value = data.url || "";
  document.getElementById("password").value = data.password || "";
  document.getElementById("refresh").value = data.refresh || 5;
  document.getElementById("badgeTextColor").value = data.badgeTextColor || "#ffffff";
  document.getElementById("badgeBgColor").value = data.badgeBgColor || "#ff6f00";

  document.querySelector(
    `input[name="openMode"][value="${data.openMode || "unread"}"]`
  ).checked = true;

  document.querySelector(
    `input[name="tabMode"][value="${data.tabMode || "new"}"]`
  ).checked = true;

  document.getElementById("instantUpdate").checked = !!data.instantUpdate;
});

document.getElementById("save").addEventListener("click", () => {
  const serverUrl = url.value.trim();

  let origin;
  try {
    origin = new URL(serverUrl).origin + "/*";
  } catch (e) {
    alert("Invalid Miniflux URL");
    return;
  }

  chrome.permissions.request(
    { origins: [origin] },
    granted => {
      if (!granted) {
        alert("Permission denied. Cannot connect to Miniflux.");
        return;
      }

      chrome.storage.sync.set({
        url: serverUrl,
        password: password.value,
        refresh: Number(refresh.value),
        badgeTextColor: badgeTextColor.value,
        badgeBgColor: badgeBgColor.value,
        openMode: document.querySelector('input[name="openMode"]:checked').value,
        tabMode: document.querySelector('input[name="tabMode"]:checked').value,
        instantUpdate: instantUpdate.checked
      }, () => {
        status.textContent = "Saved.";
        setTimeout(() => status.textContent = "", 1500);
      });
    }
  );
});
