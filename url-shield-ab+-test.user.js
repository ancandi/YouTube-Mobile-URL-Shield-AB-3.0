// ==UserScript==
// @name YouTube Mobile URL Shield AB+
// @namespace http://tampermonkey.com/
// @version 3.6
// @description Optimized Data Blockade + Instant Tap Fix
// @author ancandi
// @run-at document-start
// @match https://*.youtube.com/*
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    // 1. REDIRECT ENGINE
    if (sessionStorage.getItem('yt-ad-reload-active') === 'true' && window.location.pathname.startsWith('/watch')) {
        window.location.replace(window.location.href);
    }

    // 2. SCORCHED EARTH DATA BLOCKADE
    const injectStyles = () => {
        if (document.getElementById('yt-hard-blocker')) return;
        const style = document.createElement('style');
        style.id = 'yt-hard-blocker';
        style.innerHTML = `
            img, svg, image, [style*="background-image"], .yt-core-image, 
            .ytm-thumb, .ytp-cued-thumbnail-overlay, .ytp-videowall-still-image { 
                display: none !important; visibility: hidden !important; 
            }
            #masthead-container, .ytm-header-bar, #related, #comments, .ytm-footer { 
                display: none !important; 
            }
            html, body { background: #000 !important; }
            video { opacity: 0 !important; }
        `;
        (document.head || document.documentElement).appendChild(style);
    };

    if (sessionStorage.getItem('yt-ad-reload-active') === 'true') {
        injectStyles();
        new MutationObserver(() => {
            document.querySelectorAll('img, image').forEach(i => i.remove());
        }).observe(document.documentElement, { childList: true, subtree: true });
    }

    // 3. THE SHIELD (Unified Logic)
    const shield = document.createElement('div');
    Object.assign(shield.style, {
        position: 'fixed', left: '0', width: '100vw', zIndex: '2147483647', 
        display: 'none', cursor: 'pointer', 
        touchAction: 'manipulation' // FIX: Disables double-tap delay for instant resume
    });

    const bar = document.createElement('div');
    Object.assign(bar.style, {
        position: 'absolute', bottom: '0', width: '100%', height: '100px',
        backgroundColor: '#fff', color: '#000', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '18px',
        fontWeight: 'bold', fontFamily: 'sans-serif', boxShadow: '0 -10px 20px rgba(0,0,0,0.3)',
        pointerEvents: 'auto' // Bar catches the tap
    });
    bar.innerText = 'TAP TO UNMUTE';
    shield.appendChild(bar);

    let activeSrc = "";

    const unmute = (e) => {
        if (e) { 
            e.preventDefault(); 
            e.stopImmediatePropagation(); 
        }
        
        const v = document.querySelector('video');
        if (v) {
            activeSrc = v.src;
            v.muted = false;
            v.volume = 1.0;
            
            // Force play immediately
            const p = v.play();
            if (p !== undefined) {
                p.catch(() => { v.play(); });
            }
        }
        shield.style.display = 'none';
        return false;
    };

    // Use touchstart for lowest latency
    shield.addEventListener('touchstart', unmute, { capture: true, passive: false });
    shield.addEventListener('click', unmute, { capture: true });

    // 4. MONETIZATION KILL
    let trig = false;
    const monKill = () => {
        if (!window.location.pathname.startsWith('/watch') || trig) return;
        const ad = document.querySelector('.ad-showing, .ad-interrupting');
        const v = document.querySelector('video');
        if (ad && v && !isNaN(v.duration) && v.duration > 0) {
            trig = true;
            sessionStorage.setItem('yt-ad-reload-active', 'true');
            window.location.replace(window.location.href);
        }
    };

    // 5. MAINTENANCE (5ms Polling)
    setInterval(() => {
        const watch = window.location.pathname.startsWith('/watch');
        const v = document.querySelector('video');

        // Layout: Watch is full-screen shield, but Tap Zone is ALWAYS the bottom bar
        if (watch) {
            shield.style.top = '0'; shield.style.height = '100vh';
            shield.style.backgroundColor = 'rgba(0,0,0,0.001)'; // Invisible but present
            monKill();
        } else {
            shield.style.top = 'auto'; shield.style.bottom = '0'; shield.style.height = '100px';
            shield.style.backgroundColor = 'transparent';
            sessionStorage.removeItem('yt-ad-reload-active');
        }

        if (!v || trig) { shield.style.display = 'none'; return; }
        if (v.src !== activeSrc) activeSrc = "";

        // UI Clean
        if (!document.querySelector('.ad-showing') && sessionStorage.getItem('yt-ad-reload-active') === 'true') {
            sessionStorage.removeItem('yt-ad-reload-active');
            const s = document.getElementById('yt-hard-blocker');
            if (s) s.remove();
        }

        // Logical Check
        if (v.muted && !document.querySelector('.ad-showing') && !activeSrc) {
            if (!shield.parentElement) document.body.appendChild(shield);
            shield.style.display = 'flex';
        } else {
            shield.style.display = 'none';
        }
    }, 5);

    window.addEventListener('popstate', () => { trig = false; activeSrc = ""; });
})();
