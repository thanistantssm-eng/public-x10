const CACHE = 'x10-think-v6-secure-downloads';
const CORE = [
  './', './index.html', './404.html', './offline.html',
  './services.html', './solutions.html', './products.html', './work.html',
  './company.html', './insights.html', './contact.html', './privacy.html',
  './insight-business-before-tech.html', './insight-ai-workflow.html', './insight-maintainable-systems.html',
  './assets/styles.css', './assets/app.js', './assets/logo.png', './assets/favicon-32.png',
  './assets/visuals/home-horizon.webp', './assets/visuals/services-devices.webp', './assets/visuals/solutions-network.webp',
  './assets/visuals/products-devices.webp', './assets/visuals/work-dashboard.webp', './assets/visuals/company-team.webp',
  './assets/visuals/insights-notebook.webp', './assets/visuals/contact-workspace.webp', './assets/visuals/mission-monolith.webp',
  './site.webmanifest'
];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const req=event.request; if(req.method!=='GET') return; const url=new URL(req.url); if(url.origin!==self.location.origin) return;
  // Never cache admin, protected download endpoints, or PHP-backed access pages.
  if(url.pathname.includes('/admin/') || url.pathname.endsWith('/downloads.html') || url.pathname.endsWith('/downloads.html')) return;
  if(req.mode==='navigate') { event.respondWith(fetch(req).then(res=>{ if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));} return res; }).catch(async()=>await caches.match(req)||await caches.match('./offline.html'))); return; }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;})));
});
