// ==UserScript==
// @name YouTube Mobile URL Shield (Zero UI)
// @version 4.1.0-S
// @match https://*.youtube.com/*
// @run-at document-start
// ==/UserScript==

(function(d, w) {
    'use strict';
    let g = 0;
    const u = () => d.querySelectorAll('video').forEach(v => { v.muted && !v.paused && (v.muted = !1, v.volume = 1, v.play().catch(()=>{})) });
    (function o() {
        const p = location.pathname, isW = p.startsWith('/watch'), act = d.activeElement;
        d.querySelectorAll('ytm-ad-slot-renderer, .ad-showing').forEach(a => a.remove());
        let v = d.querySelector('video');
        (isW && v?.readyState == 0 && ++g > 60) ? (w.location.reload(), g = 0) : (g = isW ? g : 0);
        if (!(/INPUT|TEXTAREA/.test(act?.tagName)) && !d.querySelector('.ytm-sidebar-open')) u();
        requestAnimationFrame(o);
    })();
})(document, window);