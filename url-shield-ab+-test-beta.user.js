// ==UserScript==
// @name YouTube Shield (Auto Unmute, Zero UI)
// @version 4.0.0
// @match https://*.youtube.com/*
// @run-at document-start
// ==/UserScript==

(function() {
    'use strict';
    let d = document, w = window, g = 0;

    const f = () => d.querySelectorAll('video').forEach(v => { 
        if (v.src && v.muted && !v.paused) { v.muted = false; v.volume = 1; v.play().catch(()=>{}) } 
    });

    (function loop() {
        const p = location.pathname, isW = p.startsWith('/watch'), act = d.activeElement;
        
        d.querySelectorAll('ytd-ad-slot-renderer, ytm-ad-slot-renderer, .ad-showing, .ad-interrupting').forEach(t => {
            t.querySelectorAll('video, img, source').forEach(m => { m.src = ''; m.load?.(); m.remove() });
            t.innerHTML = ''; 
        });

        if (isW && d.querySelector('.ad-showing')) return w.location.replace(w.location.href.split('&ts=')[0] + (w.location.href.includes('?') ? '&' : '?') + 'ts=' + Date.now());

        let v = d.querySelector('video');
        if (isW && v?.readyState == 0 && ++g > 60) { w.history.replaceState(null, '', location.href); w.dispatchEvent(new PopStateEvent('popstate')); g = 0 } else if (!isW) g = 0;

        if (!(act && /INPUT|TEXTAREA/.test(act.tagName)) && !d.querySelector('.ytm-sidebar-open')) f();

        requestAnimationFrame(loop);
    })();
})();
