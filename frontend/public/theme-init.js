// Applies the saved theme (localStorage 'esms-theme', see ThemeContext) before React renders, so
// the page never flashes light in dark mode. Loaded from index.html as a file, not inline, so the
// server's Content-Security-Policy can keep script-src 'self' (phase 11).
;(function () {
  var stored = null
  try {
    stored = localStorage.getItem('esms-theme')
  } catch {
    stored = null
  }
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  if (stored === 'dark' || (stored === 'system' && prefersDark)) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})()
