// Independent theme controller: works even if a mini-game encounters a script error.
(() => {
  const root = document.documentElement;
  const button = document.getElementById('themeToggle');
  if (!button) return;
  const key = 'aqua_arcade_theme';
  let stored = null;
  try { stored = localStorage.getItem(key); } catch (_) {}
  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function apply(mode) {
    const isDark = mode === 'dark';
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    button.textContent = isDark ? '☀️ Light mode' : '🌙 Dark mode';
    button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    button.setAttribute('aria-pressed', String(isDark));
  }
  apply(stored === 'dark' || stored === 'light' ? stored : (media && media.matches ? 'dark' : 'light'));
  button.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    stored = next;
    try { localStorage.setItem(key, next); } catch (_) {}
  });
  if (media) {
    const onChange = e => { if (stored !== 'dark' && stored !== 'light') apply(e.matches ? 'dark' : 'light'); };
    if (media.addEventListener) media.addEventListener('change', onChange);
    else if (media.addListener) media.addListener(onChange);
  }
})();
