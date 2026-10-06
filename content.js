// Runs in every frame, but only activates for top-level device frames inside Viewly.
(() => {
  if (window === top) return;
  const ao = location.ancestorOrigins;
  if (!ao || ao.length !== 1 || ao[0] !== chrome.runtime.getURL('').slice(0, -1)) return;

  let mute = 0;
  const send = m => parent.postMessage({ viewly: 1, ...m }, '*');
  const maxScroll = () => document.documentElement.scrollHeight - innerHeight;

  const path = el => {
    const p = [];
    while (el && el.nodeType === 1 && el !== document.documentElement) {
      if (el.id) { p.unshift('#' + CSS.escape(el.id)); break; }
      const sib = [...el.parentNode.children].filter(c => c.tagName === el.tagName);
      p.unshift(el.tagName.toLowerCase() + ':nth-of-type(' + (sib.indexOf(el) + 1) + ')');
      el = el.parentNode;
    }
    return p.join('>');
  };

  addEventListener('scroll', () => {
    if (Date.now() < mute) return;
    const m = maxScroll();
    send({ t: 'scroll', r: m > 0 ? scrollY / m : 0 });
  }, { passive: true });

  addEventListener('click', e => { if (e.isTrusted) send({ t: 'click', p: path(e.target) }); }, true);

  addEventListener('input', e => {
    if (e.isTrusted && 'value' in e.target) send({ t: 'input', p: path(e.target), v: e.target.value });
  }, true);

  addEventListener('DOMContentLoaded', () => send({ t: 'nav', href: location.href }));

  addEventListener('message', e => {
    if (e.source !== parent) return;
    const m = e.data;
    if (!m || m.viewly !== 1) return;
    try {
      if (m.t === 'scroll') {
        mute = Date.now() + 200;
        scrollTo({ top: m.r * maxScroll(), behavior: 'instant' });
      } else if (m.t === 'click') {
        document.querySelector(m.p)?.click();
      } else if (m.t === 'input') {
        const el = document.querySelector(m.p);
        if (el) { el.value = m.v; el.dispatchEvent(new Event('input', { bubbles: true })); }
      }
    } catch (_) {}
  });
})();
