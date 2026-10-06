const BASE_DEVICES = [
  { id: 'iphone15', name: 'iPhone 15', w: 393, h: 852, r: 55 },
  { id: 'iphonese', name: 'iPhone SE', w: 375, h: 667, r: 20 },
  { id: 'pixel8', name: 'Pixel 8', w: 412, h: 915, r: 40 },
  { id: 's23', name: 'Galaxy S23', w: 360, h: 780, r: 36 },
  { id: 'ipadmini', name: 'iPad mini', w: 744, h: 1133, r: 28 },
  { id: 'ipadpro', name: 'iPad Pro 11"', w: 834, h: 1194, r: 28 }
];
const MAX_DEVICES = 3;
const STORAGE = {
  state: 'viewly-state',
  custom: 'viewly-custom-devices',
  history: 'viewly-recent-urls'
};
const $ = id => document.getElementById(id);
const stage = $('stage');
const readJSON = (key, def) => { try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? def; } catch (_) { return def; } };
const writeJSON = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const getCustomDevices = () => readJSON(STORAGE.custom, []);
const getAllDevices = () => [...BASE_DEVICES, ...getCustomDevices()];
const dev = id => getAllDevices().find(d => d.id === id);
let customDevices = getCustomDevices();
let url = new URLSearchParams(location.search).get('url') || '';
let state = { devs: [{ d: 'iphone15' }, { d: 'pixel8' }, { d: 'ipadmini' }], scale: 55, sync: true };
try { Object.assign(state, JSON.parse(localStorage.getItem(STORAGE.state) || '{}')); } catch (_) {}
const save = () => localStorage.setItem(STORAGE.state, JSON.stringify(state));
const frames = () => [...stage.querySelectorAll('iframe')];

function getRecentUrls() {
  return readJSON(STORAGE.history, []);
}

function saveRecentUrl(next) {
  if (!next) return;
  const cleaned = next.trim();
  if (!cleaned) return;
  const list = getRecentUrls().filter(v => v && v !== cleaned);
  list.unshift(cleaned);
  writeJSON(STORAGE.history, list.slice(0, 8));
  renderHistory();
}

function renderHistory() {
  const history = getRecentUrls();
  const sel = $('history');
  sel.innerHTML = '<option value="">Recent URLs</option>' + history.map((v, i) =>
    `<option value="${v}"${i === 0 ? ' selected' : ''}>${v}</option>`) .join('');
  if (!history.length) sel.value = '';
}

function layout() {
  const k = state.scale / 100;
  for (const el of stage.children) {
    const s = el._s, d = dev(s.d), w = s.land ? d.h : d.w, h = s.land ? d.w : d.h;
    const scr = el.querySelector('.screen'), f = el.querySelector('iframe');
    scr.style.width = w * k + 'px'; scr.style.height = h * k + 'px';
    scr.style.borderRadius = d.r * k + 'px';
    el.querySelector('.bezel').style.borderRadius = d.r * k + 10 + 'px';
    f.style.width = w + 'px'; f.style.height = h + 'px'; f.style.transform = `scale(${k})`;
    el.querySelector('.dim').textContent = `${w} × ${h}`;
  }
  $('sv').textContent = state.scale + '%';
  $('add').disabled = state.devs.length >= MAX_DEVICES;
}

function mk(s) {
  const el = document.createElement('div');
  el.className = 'dev'; el._s = s;
  el.innerHTML = `<div class="bar"><select>${getAllDevices().map(d =>
    `<option value="${d.id}"${d.id === s.d ? ' selected' : ''}>${d.name}</option>`).join('')}</select>
    <span class="dim"></span><button class="rot" title="Rotate">⟳</button><button class="del" title="Remove">✕</button></div>
    <div class="bezel"><div class="screen"><iframe></iframe></div></div>`;
  el.querySelector('iframe').src = url;
  el.querySelector('select').onchange = e => { s.d = e.target.value; save(); layout(); };
  el.querySelector('.rot').onclick = () => { s.land = !s.land; save(); layout(); };
  el.querySelector('.del').onclick = () => { state.devs.splice(state.devs.indexOf(s), 1); el.remove(); save(); layout(); };
  stage.append(el);
}

function rebuildDevices() {
  stage.innerHTML = '';
  state.devs.forEach(mk);
  layout();
}

function addCustomDevice() {
  const name = $('custom-name').value.trim();
  const width = Number($('custom-width').value);
  const height = Number($('custom-height').value);
  const radius = Number($('custom-radius').value);
  if (!name || !width || !height) return;
  const id = `custom-${Date.now()}`;
  const preset = { id, name, w: width, h: height, r: radius || 24 };
  customDevices = [...getCustomDevices(), preset];
  writeJSON(STORAGE.custom, customDevices);
  const used = state.devs.map(s => s.d);
  const next = { d: preset.id };
  state.devs.push(next);
  save();
  rebuildDevices();
  $('custom-name').value = '';
  $('custom-width').value = '390';
  $('custom-height').value = '844';
  $('custom-radius').value = '38';
}

// Sync hub: relay a device frame's events to all the other frames.
addEventListener('message', e => {
  const m = e.data;
  if (!m || m.viewly !== 1) return;
  if (m.t === 'nav') { if (e.source === frames()[0]?.contentWindow) $('url').value = m.href; return; }
  if (!state.sync) return;
  for (const f of frames()) if (f.contentWindow !== e.source) f.contentWindow.postMessage(m, '*');
});

function load(u) {
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  url = u; $('url').value = u;
  saveRecentUrl(u);
  frames().forEach(f => f.src = u);
}

$('url').onkeydown = e => { if (e.key === 'Enter') load(e.target.value.trim()); };
$('save-url').onclick = () => saveRecentUrl($('url').value);
$('history').onchange = e => { if (e.target.value) load(e.target.value); };
$('scale').oninput = e => { state.scale = +e.target.value; save(); layout(); };
$('sync').onchange = e => { state.sync = e.target.checked; save(); };
$('add').onclick = () => {
  const used = state.devs.map(s => s.d);
  const s = { d: (getAllDevices().find(d => !used.includes(d.id)) || getAllDevices()[0]).id };
  state.devs.push(s); mk(s); save(); layout();
};
$('add-custom').onclick = addCustomDevice;

$('shot').onclick = async () => {
  const b = $('shot'); b.disabled = true;
  try {
    const data = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    const img = await createImageBitmap(await (await fetch(data)).blob());
    const k = img.width / innerWidth, r = stage.getBoundingClientRect();
    const c = document.createElement('canvas');
    c.width = r.width * k; c.height = r.height * k;
    c.getContext('2d').drawImage(img, r.left * k, r.top * k, c.width, c.height, 0, 0, c.width, c.height);
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = `viewly-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
    a.click();
  } catch (err) { alert('Screenshot failed: ' + err.message); }
  b.disabled = false;
};

chrome.runtime.sendMessage({ t: 'enable' }, () => {
  $('scale').value = state.scale; $('sync').checked = state.sync; $('url').value = url;
  renderHistory();
  state.devs.slice(0, MAX_DEVICES).forEach(mk);
  layout();
});
