// ==UserScript==
// @name YouTube Mobile URL Shield - Icon Aware
// @namespace http://tampermonkey.com/
// @version 5.1.0
// @description Detects native Mute Icon on /results to trigger Unmute Bar
// @author ancandi
// @run-at document-start
// @match https://*.youtube.com/*
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    let lastTapTime = 0;
    let isNavigating = false;

    // --- 1. NAVIGATION STABILIZER ---
    window.addEventListener('popstate', () => {
        isNavigating = true;
        setTimeout(() => { isNavigating = false; }, 1200);
    });

    // --- 2. NUCLEAR RELOAD (Ad Purge) ---
    const nuclearReload = () => {
        if (isNavigating) return;
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('reload_ts', Date.now());
        try { sessionStorage.setItem('yt-ad-reload-active', 'true'); } catch(e) {}
        window.location.replace(currentUrl.toString());
    };

    // --- 3. DATA PREDATOR ---
    const predator = new MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++) {
            const nodes = mutations[i].addedNodes;
            for (let j = 0; j < nodes.length; j++) {
                const node = nodes[j];
                if (node.nodeType !== 1) continue;
                const isAd = node.classList?.contains('ad-showing') || node.closest?.('.ad-showing') || node.querySelector?.('.ytd-ad-slot-renderer');
                if (isAd && !isNavigating) { nuclearReload(); return; }
            }
        }
    });
    predator.observe(document.documentElement, { childList: true, subtree: true });

    // --- 4. THE UI SHIELD (Strictly for /results) ---
    const shield = document.createElement('div');
    Object.assign(shield.style, {
        position: 'fixed', left: '0', bottom: '0', width: '100vw', height: '100px',
        zIndex: '2147483647', display: 'none', cursor: 'pointer', touchAction: 'manipulation'
    });

    const visualBar = document.createElement('div');
    Object.assign(visualBar.style, {
        position: 'absolute', inset: '0', backgroundColor: '#0f0f0f', color: '#ffffff',
        textAlign: 'center', lineHeight: '100px', fontSize: '18px', fontWeight: 'bold',
        fontFamily: 'sans-serif', borderTop: '1px solid #333'
    });
    visualBar.innerText = 'TAP TO UNMUTE SEARCH RESULT';
    shield.appendChild(visualBar);
    document.body.appendChild(shield);

    // --- 5. THE UNMUTE ACTIVATOR ---
    shield.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const videos = document.querySelectorAll('video');
        videos.forEach(v => {
            v.muted = false;
            v.volume = 1.0;
            v.play().catch(() => {});
        });
        lastTapTime = Date.now();
        shield.style.display = 'none';
    }, { capture: true, passive: false });

    // --- 6. SMART DETECTION LOOP ---
    setInterval(() => {
        const path = window.location.pathname;
        if (!path.startsWith('/results')) {
            shield.style.display = 'none';
            return;
        }

        const adShowing = !!document.querySelector('.ad-showing');
        if (adShowing && !isNavigating) { nuclearReload(); return; }

        // COOLDOWN: Don't show immediately after a tap
        if (Date.now() - lastTapTime < 3000) return;

        // --- ICON DETECTION LOGIC ---
        // We search for YouTube's native "Muted" icon (Speaker with X / Mute Overlay)
        // Usually found in ytm-muted-autoplay-status-renderer or similar paths
        const muteIcons = document.querySelectorAll('ytm-muted-autoplay-status-renderer, .Muted, [aria-label*="unmute"], .icon-button[aria-pressed="false"]');
        
        let shouldShowBar = false;
        muteIcons.forEach(icon => {
            const rect = icon.getBoundingClientRect();
            // If the icon is visible on screen, it means the video is "Audio Receivable" but muted
            if (rect.top > 0 && rect.bottom < window.innerHeight) {
                shouldShowBar = true;
            }
        });

        if (shouldShowBar) {
            shield.style.display = 'block';
        } else {
            shield.style.display = 'none';
        }

    }, 100);
})();
