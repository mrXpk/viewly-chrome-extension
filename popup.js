const u = document.getElementById('u'), go = document.getElementById('go');
chrome.tabs.query({ active: true, currentWindow: true }).then(([t]) => {
  const ok = t && /^https?:/.test(t.url || '');
  u.textContent = ok ? t.url : "Viewly can't preview this page. Open a website first.";
  go.disabled = !ok;
  go.onclick = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('viewer.html') + '?url=' + encodeURIComponent(t.url) });
    window.close();
  };
});
