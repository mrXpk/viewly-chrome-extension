// Strip frame-blocking headers ONLY for sub-frames inside a Viewly workspace tab.
chrome.runtime.onMessage.addListener((m, sender, reply) => {
  if (m.t !== 'enable' || !sender.tab) return;
  const id = sender.tab.id;
  chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [id],
    addRules: [{
      id, priority: 1,
      action: { type: 'modifyHeaders', responseHeaders: [
        { header: 'x-frame-options', operation: 'remove' },
        { header: 'content-security-policy', operation: 'remove' }
      ]},
      condition: { tabIds: [id], resourceTypes: ['sub_frame'] }
    }]
  }).then(() => reply(true));
  return true;
});
chrome.tabs.onRemoved.addListener(id =>
  chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [id] }));
