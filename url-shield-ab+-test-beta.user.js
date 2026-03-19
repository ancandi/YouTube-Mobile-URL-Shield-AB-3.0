// ==UserScript==
// @name YouTube Shield (Auto Unmute, Annoyance BLocker - Zero UI)
// @version 4.0.0
// @match https://*.youtube.com/*
// @run-at document-start
// ==/UserScript==

(function() {
    'use strict';
    const d = document;

    // Ghost Detector
    new MutationObserver(() => {
        const v = d.querySelector('video');
        if (d.querySelector('.ad-showing')) location.replace(location.href + (location.href.includes('?') ? '&' : '?') + Date.now());
        if (v && !d.querySelector('#app, ytm-app') && d.body.children.length < 5) location.replace(location.href);
    }).observe(d.documentElement, { childList: true, subtree: true });

    // Silent Unmute Loop
    setInterval(() => {
        if (d.activeElement && /INPUT|TEXTAREA/.test(d.activeElement.tagName)) return;
        d.querySelectorAll('video').forEach(v => {
            if (v.src && v.muted && !v.paused) {
                v.muted = false;
                v.volume = 1;
                v.play().catch(() => {});
            }
        });
    }, 200);
})();
