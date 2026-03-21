// ==UserScript==
// @name YouTube Mobile URL Shield (Auto Unmute, Zero UI)
// @version 4.0.1
// @match https://*.youtube.com/*
// @run-at document-start
// ==/UserScript==

(function(d, w) {
    'use strict';
    let g = 0;
    const f = () => d.querySelectorAll('video').forEach(v => {
        if (v.muted && !v.paused) { v.muted = !1; v.volume = 1; v.play().catch(()=>{}) }
    });
    (function l() {
        const p = location.pathname, isW = p.startsWith('/watch'), act = d.activeElement;
        d.querySelectorAll('ytd-ad-slot-renderer, ytm-ad-slot-renderer, .ad-showing').forEach(s => s.remove());
        let v = d.querySelector('video');
        (isW && v?.readyState == 0 && ++g > 60) ? (w.dispatchEvent(new PopStateEvent('popstate')), g = 0) : (!isW && (g = 0));
        if (!(act && /INPUT|TEXTAREA/.test(act.tagName)) && !d.querySelector('.ytm-sidebar-open')) f();
        requestAnimationFrame(l);
    })();
})(document, window);