(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const menuBtn = document.querySelector('.menu-button');
  const mobile = document.querySelector('.mobile-panel');
  const loader = document.getElementById('loader');
  const themeBtn = document.getElementById('theme-toggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const currentTheme = () => root.getAttribute('data-theme') || 'dark';
  const syncThemeMeta = () => {
    themeMeta?.setAttribute('content', currentTheme() === 'light' ? '#f3f3f0' : '#070708');
    themeBtn?.setAttribute('aria-label', currentTheme() === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  };
  syncThemeMeta();
  themeBtn?.addEventListener('click', () => {
    const next = currentTheme() === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('x10-theme', next); } catch (_) {}
    syncThemeMeta();
  });

  // Full brand loader only once per browser session. Subsequent navigation stays fast.
  const hideLoader = () => loader?.classList.add('hide');
  let seenLoader = false;
  try { seenLoader = sessionStorage.getItem('x10-loader-seen') === '1'; } catch (_) {}
  if (seenLoader || reducedMotion) hideLoader();
  else {
    window.addEventListener('load', () => window.setTimeout(() => {
      hideLoader();
      try { sessionStorage.setItem('x10-loader-seen','1'); } catch (_) {}
    }, 650), { once:true });
    window.setTimeout(hideLoader, 1800);
  }

  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 14);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });

  // Thin progress indicator: useful feedback without competing with the content.
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden','true');
  document.body.appendChild(progress);
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progress.style.transform = `scaleX(${ratio})`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive:true });
  window.addEventListener('resize', updateProgress, { passive:true });

  const systemVisual = document.querySelector('.hero-system');
  if (systemVisual && !reducedMotion && window.matchMedia?.('(hover:hover)').matches) {
    systemVisual.addEventListener('pointermove', e => {
      const r = systemVisual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      systemVisual.style.transform = `perspective(1200px) rotateY(${(-2 + x * 3).toFixed(2)}deg) rotateX(${(1 - y * 2).toFixed(2)}deg) translateY(-2px)`;
    });
    systemVisual.addEventListener('pointerleave', () => { systemVisual.style.transform = 'perspective(1200px) rotateY(-2deg) rotateX(1deg)'; });
  }

  const setMenu = open => {
    if (!mobile || !menuBtn) return;
    mobile.classList.toggle('open', open);
    mobile.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menuBtn.textContent = open ? '×' : '☰';
    document.body.classList.toggle('menu-open', open);
    if (open) mobile.querySelector('a')?.focus();
  };
  menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  mobile?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  if ('IntersectionObserver' in window && !reducedMotion) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold:.10, rootMargin:'0px 0px -24px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));

  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  // Static-site project brief tool: autosave locally, validate, prepare a shareable brief.
  const form = document.querySelector('#contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    const output = document.querySelector('#brief-output');
    const briefText = document.querySelector('#brief-text');
    const message = form.querySelector('#message');
    const counter = document.querySelector('#message-count');
    const draftKey = 'x10-project-brief-draft-v1';
    const fields = [...form.querySelectorAll('input,select,textarea')];
    const setStatus = (text, error=false) => {
      if (!status) return;
      status.textContent = text; status.classList.add('show'); status.classList.toggle('error', error);
    };
    const updateCount = () => { if (counter && message) counter.textContent = `${message.value.length} / 2000`; };
    const saveDraft = () => {
      const data = Object.fromEntries(fields.filter(x => x.name).map(x => [x.name,x.value]));
      try { localStorage.setItem(draftKey, JSON.stringify(data)); } catch (_) {}
    };
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || '{}');
      fields.forEach(x => { if (x.name && saved[x.name] != null) x.value = saved[x.name]; });
    } catch (_) {}
    updateCount();
    fields.forEach(x => x.addEventListener('input', () => { saveDraft(); updateCount(); }));
    fields.forEach(x => x.addEventListener('change', saveDraft));

    const makeBrief = () => {
      const data = new FormData(form);
      return `X10 THINK — PROJECT BRIEF\n\nName: ${data.get('name') || '-'}\nCompany: ${data.get('company') || '-'}\nEmail: ${data.get('email') || '-'}\nPhone: ${data.get('phone') || '-'}\nProject type: ${data.get('type') || '-'}\n\nProblem / idea:\n${data.get('message') || '-'}`;
    };
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        setStatus('Complete the required fields so the project brief can be prepared.', true);
        return;
      }
      const text = makeBrief();
      if (briefText) briefText.textContent = text;
      if (output) output.hidden = false;
      setStatus('Project brief prepared. Copy or share it using the options below.');
      output?.scrollIntoView({behavior: reducedMotion ? 'auto':'smooth', block:'nearest'});
    });
    document.querySelector('#copy-brief')?.addEventListener('click', async () => {
      const text = briefText?.textContent || makeBrief();
      try { await navigator.clipboard.writeText(text); setStatus('Project brief copied to clipboard.'); }
      catch (_) { setStatus('Clipboard access was blocked. Select the brief text and copy it manually.', true); }
    });
    const shareBtn = document.querySelector('#share-brief');
    if (!navigator.share && shareBtn) shareBtn.hidden = true;
    shareBtn?.addEventListener('click', async () => {
      try { await navigator.share({title:'X10 Think project brief',text:briefText?.textContent || makeBrief()}); }
      catch (err) { if (err?.name !== 'AbortError') setStatus('Sharing is not available in this browser.', true); }
    });
    document.querySelector('#clear-draft')?.addEventListener('click', () => {
      form.reset(); updateCount(); if (output) output.hidden = true;
      try { localStorage.removeItem(draftKey); } catch (_) {}
      setStatus('Local draft cleared.');
    });
  }

  const toast = document.createElement('div');
  toast.className = 'connection-toast'; toast.setAttribute('role','status'); toast.setAttribute('aria-live','polite');
  toast.innerHTML = '<span class="connection-dot" aria-hidden="true"></span><span class="connection-copy"></span>';
  document.body.appendChild(toast);
  let toastTimer;
  const showConnection = online => {
    clearTimeout(toastTimer); toast.classList.toggle('online', online);
    const copy = toast.querySelector('.connection-copy'); if (copy) copy.textContent = online ? 'Connection restored' : 'You are offline';
    toast.classList.add('show'); toastTimer = setTimeout(() => toast.classList.remove('show'), online ? 2200 : 4000);
  };
  window.addEventListener('online', () => showConnection(true));
  window.addEventListener('offline', () => showConnection(false));
  if (!navigator.onLine) showConnection(false);

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}), { once:true });
  }
})();

// V6 Downloads interactions
(() => {
  const purpose = document.querySelector('#purpose');
  const counter = document.querySelector('#purpose-count');
  const updatePurpose = () => { if (purpose && counter) counter.textContent = `${purpose.value.length} / 1200`; };
  purpose?.addEventListener('input', updatePurpose); updatePurpose();
  const appSelect = document.querySelector('#app_id');
  document.querySelectorAll('.request-build').forEach(btn => btn.addEventListener('click', () => {
    if (appSelect) {
      appSelect.value = btn.dataset.appId || '';
      document.querySelector('#request-access')?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto':'smooth'});
      setTimeout(() => appSelect.focus(), 450);
    }
  }));
  document.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const value = btn.dataset.copy || '';
    try { await navigator.clipboard.writeText(value); const old = btn.textContent; btn.textContent='Copied'; setTimeout(()=>btn.textContent=old,1200); }
    catch (_) { window.prompt('Copy this value:', value); }
  }));
})();
