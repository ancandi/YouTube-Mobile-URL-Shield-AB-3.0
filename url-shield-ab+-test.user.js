// ==UserScript==
// @name YouTube Mobile URL Shield AB+
// @namespace http://tampermonkey.com/
// @version 3.8
// @description Split Logic: Native /watch Unmute + Custom Home Shield
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

    // 3. THE SHIELD
    const shield = document.createElement('div');
    Object.assign(shield.style, {
        position: 'fixed', left: '0', width: '100vw', zIndex: '2147483647', 
        display: 'none', cursor: 'pointer', touchAction: 'manipulation'
    });

    const bar = document.createElement('div');
    Object.assign(bar.style, {
        position: 'absolute', bottom: '0', width: '100%', height: '100px',
        backgroundColor: '#fff', color: '#000', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '18px',
        fontWeight: 'bold', fontFamily: 'sans-serif', boxShadow: '0 -10px 20px rgba(0,0,0,0.3)'
    });
    bar.innerText = 'TAP TO UNMUTE';
    shield.appendChild(bar);

    let activeSrc = "";

    const unmuteHome = (e) => {
        // Only run custom unmute logic if NOT on /watch
        if (window.location.pathname.startsWith('/watch')) return;

        if (e) { e.preventDefault(); e.stopImmediatePropagation(); }
        const videos = document.querySelectorAll('video');
        videos.forEach(v => {
            activeSrc = v.src;
            v.muted = false;
            v.volume = 1.0;
            v.play().catch(() => v.play());
        });
        shield.style.display = 'none';
        return false;
    };

    shield.addEventListener('touchstart', unmuteHome, { capture: true, passive: false });
    shield.addEventListener('click', unmuteHome, { capture: true });

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
        const isWatch = window.location.pathname.startsWith('/watch');
        const videos = document.querySelectorAll('video');
        let mutedFound = false;

        if (isWatch) {
            // /watch logic: Full screen but NO pointer events on the shield itself
            // This lets the tap hit the YouTube player directly to unmute without pausing.
            shield.style.top = '0'; 
            shield.style.height = '100vh';
            shield.style.pointerEvents = 'none'; 
            bar.style.display = 'none'; // Hide bar on watch to use native UI
            monKill();
        } else {
            // Homepage logic: Bottom bar is clickable, rest of screen is free
            shield.style.top = 'auto'; 
            shield.style.bottom = '0'; 
            shield.style.height = '100px';
            shield.style.pointerEvents = 'auto';
            bar.style.display = 'flex';
            sessionStorage.removeItem('yt-ad-reload-active');
        }

        videos.forEach(v => {
            if (v.muted && v.src !== activeSrc && !document.querySelector('.ad-showing')) {
                mutedFound = true;
            }
            if (v.src !== activeSrc && activeSrc !== "") {
                activeSrc = "";
            }
        });

        if (trig || videos.length === 0) { shield.style.display = 'none'; return; }

        if (!document.querySelector('.ad-showing') && sessionStorage.getItem('yt-ad-reload-active') === 'true') {
            sessionStorage.removeItem('yt-ad-reload-active');
            const s = document.getElementById('yt-hard-blocker');
            if (s) s.remove();
        }

        if (mutedFound) {
            if (!shield.parentElement) document.body.appendChild(shield);
            shield.style.display = 'flex';
        } else {
            shield.style.display = 'none';
        }
    }, 5);

    window.addEventListener('popstate', () => { trig = false; activeSrc = ""; });
})();
