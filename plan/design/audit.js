// Visual audit for the v2.5 design playgrounds. It renders every combination of a playground's controls and reports:
// an icon or step marker not on the first line of the text after it, text clipped or outside its frame, text over
// text, text contrast under WCAG AA, and broken values (undefined, NaN, empty icon paths).
// Run it in the browser pane on http://127.0.0.1:5510/<playground>.html (the design-playgrounds server), from the console:
//   await fetch('audit.js').then(r => r.text()).then(t => new Function(t)()); window.__audit({ limit: 600 })
// Known non-issues: the bell count badge, numbers inside coloured step diamonds (the colour is a pseudo-element),
// and the closed Help drawer in the foundations motion demo.
window.__audit = function (opts = {}) {
  const root = () => document.getElementById('ds') || document.getElementById('frame');
  const keys = Object.keys(SEGS).filter(k => k in DEFAULTS);
  const bools = Object.keys(DEFAULTS).filter(k => typeof DEFAULTS[k] === 'boolean');
  const segValues = k => SEGS[k].length ? SEGS[k] : (typeof VARIANTS !== 'undefined' ? [...new Map(Object.values(VARIANTS).flat().map(v => [v[0], v])).values()] : []);
  const vals = k => segValues(k).map(x => typeof DEFAULTS[k] === 'number' ? Number(x[0]) : x[0]);
  let combos = [{}];
  for (const k of keys) combos = combos.flatMap(c => vals(k).map(v => ({ ...c, [k]: v })));
  if (bools.length) combos = combos.concat(combos.map(c => ({ ...c, ...Object.fromEntries(bools.map(b => [b, !DEFAULTS[b]])) })));
  if (opts.limit && combos.length > opts.limit) { const step = combos.length / opts.limit; combos = combos.filter((_, i) => Math.floor(i % step) === 0); }

  const out = new Map();
  const add = (kind, key, where) => { const k = kind + ' | ' + key; if (!out.has(k)) out.set(k, { kind, key, where, n: 0 }); out.get(k).n++; };
  const rgb = c => (c.match(/[\d.]+/g) || [0, 0, 0]).map(Number);
  const lum = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0);
  const bgOf = el => { while (el && el.nodeType === 1) { const a = rgb(getComputedStyle(el).backgroundColor); if (!(a.length === 4 && a[3] < 0.9)) return a.slice(0, 3); el = el.parentElement; } return [255, 255, 255]; };
  const desc = el => { const t = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40); return `${el.tagName.toLowerCase()}.${String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).trim().split(/\s+/).slice(0, 2).join('.')}${t ? ` "${t}"` : ''}`; };
  const visible = el => { const dd = el.closest('details:not([open])'); if (dd && !el.closest('summary')) return false; const r = el.getBoundingClientRect(); if (!r.width || !r.height) return false; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; } return true; };
  const layer = el => { for (let e = el.parentElement; e; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === 'absolute' || p === 'fixed' || p === 'sticky') return e; if (e === root()) return e; } return null; };
  const clip = el => { let r = el.getBoundingClientRect(); let o = { l: r.left, t: r.top, r: r.right, b: r.bottom }; for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') { const p = e.getBoundingClientRect(); o = { l: Math.max(o.l, p.left), t: Math.max(o.t, p.top), r: Math.min(o.r, p.right), b: Math.min(o.b, p.bottom) }; } } return o; };
  const ownText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());

  for (const c of combos) {
    Object.assign(S, DEFAULTS, c);
    try { updateAll(); } catch (e) { add('render-error', e.message, JSON.stringify(c)); continue; }
    const R = root(); if (!R) { add('no-root', '', ''); break; }
    const where = Object.entries(S).filter(([k, v]) => v !== DEFAULTS[k]).map(([k, v]) => `${k}=${v}`).join(' ') || 'defaults';
    const html = R.innerHTML;
    if (/undefined|NaN|\$\{|\[object/.test(html.replace(/aria-[a-z]+="[^"]*"/g, ''))) { const m = html.match(/.{0,40}(undefined|NaN|\$\{|\[object).{0,40}/); add('bad-text', m ? m[0] : '', where); }
    R.querySelectorAll('path').forEach(p => { const d = p.getAttribute('d'); if (!d || d === 'undefined') add('broken-icon', desc(p.closest('svg').parentElement), where); });

    const els = [...R.querySelectorAll('*')].filter(e => !e.closest('svg') || e.tagName === 'svg');
    const leaves = [];
    for (const el of els) {
      if (!visible(el)) continue;
      const cs = getComputedStyle(el);
      // 1. icon alignment with the text beside it
      if ((el.tagName === 'svg' && !el.closest('.dia,.count,.av,.avt,.box1,.rad,.mk')) || el.classList.contains('dia')) {
        const p = el.parentElement, pcs = getComputedStyle(p);
        if (!(pcs.display.includes('flex') && pcs.flexDirection.startsWith('column'))) {
          let tn = null;
          let seen = false; for (const n of p.childNodes) { if (n === el) { seen = true; continue; } if (!seen) continue; if (n.nodeType === 3 && n.textContent.trim()) { tn = n; break; } if (n.nodeType === 1 && n.tagName !== 'svg' && n.textContent.trim() && visible(n) && getComputedStyle(n).position !== 'absolute') { const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT, { acceptNode: x => x.textContent.trim() ? 1 : 3 }); tn = w.nextNode(); if (tn) break; } }
          if (tn) {
            const rg = document.createRange(); rg.selectNodeContents(tn); const lr = rg.getClientRects()[0];
            const ir = el.getBoundingClientRect();
            if (lr && ir.bottom > lr.top - 6 && ir.top < lr.bottom + 6) {
              const dy = (ir.top + ir.height / 2) - (lr.top + lr.height / 2);
              if (Math.abs(dy) > 2.5) add('icon-misaligned', `${desc(p)} icon ${dy > 0 ? 'low' : 'high'} by ${Math.abs(dy).toFixed(1)}px`, where);
            }
          }
        }
      }
      if (el.tagName === 'svg') continue;
      // 2. overflow and clipping
      if ((cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1 && !el.classList.contains('sr') && !['TEXTAREA', 'INPUT'].includes(el.tagName) && !el.classList.contains('clamp')) add('clipped-x', desc(el) + ` by ${el.scrollWidth - el.clientWidth}px`, where);
      if (cs.overflowY === 'hidden' && el.scrollHeight > el.clientHeight + 2 && !el.classList.contains('clamp') && !el.classList.contains('sr') && el.textContent.trim() && !el.matches('.phone,.scene,.ds,.frame,.viewport,.shell,.device') && !['TEXTAREA', 'INPUT'].includes(el.tagName)) add('clipped-y', desc(el) + ` by ${el.scrollHeight - el.clientHeight}px`, where);
      const box = el.parentElement && (el.parentElement.closest('.phone,.scene,.device,.dev,.screen') || R);
      if (box && box !== el) { const r = el.getBoundingClientRect(), b = box.getBoundingClientRect(); if (r.right > b.right + 1 || r.left < b.left - 1) add('overflow-x', desc(el) + ` out of ${desc(box).split(' ')[0]} by ${Math.round(Math.max(r.right - b.right, b.left - r.left))}px`, where); }
      // 3. contrast
      if (ownText(el) && !el.closest('[aria-disabled=true],.sr,.scrim,[disabled]') && !el.matches('input,textarea')) {
        const fg = rgb(cs.color).slice(0, 3), bg = bgOf(el); const L1 = lum(fg), L2 = lum(bg);
        const cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
        const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.6 && +cs.fontWeight >= 700);
        if (cr < (big ? 3 : 4.5) && +cs.opacity === 1) add('contrast', `${desc(el)} ${cr.toFixed(2)}`, where);
        leaves.push(el);
      }
    }
    // 4. text over text (same layer only)
    const rects = leaves.map(e => { const c = clip(e); return { e, r: { left: c.l, top: c.t, right: c.r, bottom: c.b }, l: layer(e) }; }).filter(x => x.r.right - x.r.left > 1 && x.r.bottom - x.r.top > 1);
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j]; if (a.l !== b.l) continue;
      if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
      const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (w > 3 && h > 3) add('text-overlap', `${desc(a.e)} × ${desc(b.e)} (${Math.round(w)}×${Math.round(h)})`, where);
    }
  }
  Object.assign(S, DEFAULTS); updateAll();
  return { combos: combos.length, issues: [...out.values()].sort((a, b) => a.kind.localeCompare(b.kind)).map(x => `${x.kind}: ${x.key}  [${x.n}× e.g. ${x.where}]`) };
};
