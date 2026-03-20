// ==UserScript==
// @name YouTube Mobile URL Shield AB+
// @version 3.0.6
// @match https://*.youtube.com/*
// @run-at document-start
// ==/UserScript==

(function() {
    'use strict';
    let l = false, g = 0, u = false, d = document, w = window;
    const el = (t, s) => Object.assign(d.createElement(t), { style: s }),
          css = (e, s) => Object.assign(e.style, s),
          sh = el('div', 'position:fixed;inset:0;z-index:2147483647;display:none'),
          br = el('div', 'position:absolute;bottom:0;width:100%;height:120px;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:20px;backdrop-filter:blur(10px);webkit-backdrop-filter:blur(10px);pointer-events:auto'),
          hi = el('div', 'position:fixed;bottom:120px;left:15px;width:90px;height:45px;text-align:center;line-height:45px;border-radius:12px 12px 0 0;z-index:2147483647;display:none;font-weight:900;font-size:14px;pointer-events:auto'),
          tb = el('div', 'position:fixed;bottom:40px;right:20px;width:70px;height:45px;border-radius:12px;z-index:0;display:none;backdrop-filter:blur(8px);webkit-backdrop-filter:blur(8px);pointer-events:none'),
          th = el('div', 'position:fixed;bottom:40px;right:20px;width:70px;height:45px;z-index:2147483647;display:none;pointer-events:auto');

    br.innerText = 'TAP TO UNMUTE'; hi.innerText = 'HIDE'; sh.append(br);
    
    const f = () => d.querySelectorAll('video').forEach(v => { v.muted = false; v.volume = 1; if(v.paused) v.play().catch(()=>{}) });

    const trig = (e) => {
        if (sh.style.display == 'none' || l) return;
        if (br.contains(e.target) || (location.pathname.startsWith('/watch') && sh.style.pointerEvents == 'auto')) {
            e.preventDefault(); e.stopImmediatePropagation(); u = true; sh.style.display = 'none';
            let s = Date.now(), h = () => { f(); if (Date.now() - s < 500) requestAnimationFrame(h) }; h();
        }
    };

    w.addEventListener('touchstart', trig, { capture: true, passive: false });
    hi.ontouchstart = e => { e.preventDefault(); e.stopPropagation(); l = true };
    th.ontouchstart = e => { e.preventDefault(); e.stopPropagation(); l = false };

    (function loop() {
        const p = location.pathname, isW = p.startsWith('/watch'), isS = p.startsWith('/results'), act = d.activeElement;
        if (isW && d.querySelector('.ad-showing')) return w.location.replace(w.location.href.split('&ts=')[0] + (w.location.href.includes('?') ? '&' : '?') + 'ts=' + Date.now());

        let v = d.querySelector('video'), isD = w.matchMedia('(prefers-color-scheme: dark)').matches || d.documentElement.hasAttribute('dark');
        if (isW && v?.readyState == 0 && ++g > 60) { w.history.replaceState(null, '', location.href); w.dispatchEvent(new PopStateEvent('popstate')); g = 0 } else if (!isW) g = 0;

        if ((act && /INPUT|TEXTAREA/.test(act.tagName)) || d.querySelector('.ytm-sidebar-open')) {
            sh.style.display = hi.style.display = tb.style.display = th.style.display = 'none';
        } else {
            const c = isD ? ['#fff', '#111', '#333', 'rgba(15,15,15,0.9)'] : ['#0f0f0f', '#fff', '#e5e5e5', 'rgba(255,255,255,0.9)'];
            br.style.background = c[3]; br.style.color = c[0]; br.style.borderTop = `1px solid ${c[2]}`;
            hi.style.background = c[0]; hi.style.color = c[1]; hi.style.border = `1px solid ${c[2]}`; hi.style.borderBottom = 'none';
            tb.style.background = isD ? 'rgba(28,28,28,0.75)' : 'rgba(240,240,240,0.75)';
            tb.style.border = `1px solid rgba(${isD?255:0},${isD?255:0},${isD?255:0},0.1)`;

            sh.style.pointerEvents = isW ? 'auto' : 'none';
            if (l && isS) {
                sh.style.display = hi.style.display = 'none'; if (!tb.parentNode) d.body.append(sh, tb, th);
                tb.style.display = th.style.display = 'block';
            } else {
                tb.style.display = th.style.display = 'none';
                let n = [...d.getElementsByTagName('video')].some(v => v.src && !v.paused && v.muted);
                if (n) {
                    if (!sh.parentNode) d.body.append(sh, hi); sh.style.display = 'block';
                    hi.style.display = (isS && !l) ? 'block' : 'none';
                } else if (!u) sh.style.display = hi.style.display = 'none';
            }
        }
        u = false; requestAnimationFrame(loop);
    })();
})();
