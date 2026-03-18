// ==UserScript==
// @name YouTube Mobile URL Shield - Surgical Search
// @namespace http://tampermonkey.com/
// @version 5.1.1
// @description v4.8.2 Stable Core + Surgical Icon Detection for /results
// @author ancandi
// @run-at document-start
// @match https://*.youtube.com/*
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    let userWantsUnmute = false; 
    let activeSrc = ""; 
    let forceResumeTimer = null;
    let isNavigating = false;

    // --- 1. STABLE NAVIGATION (v4.8.2) ---
    window.addEventListener('popstate', () => {
        isNavigating = true;
        setTimeout(() => { isNavigating = false; }, 1200);
    });

    // --- 2. STABLE NUCLEAR RELOAD (v4.8.2) ---
    const nuclearReload = () => {
        if (isNavigating) return;
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('reload_ts', Date.now());
        try { sessionStorage.setItem('yt-ad-reload-active', 'true'); } catch(e) {}
        window.location.replace(currentUrl.toString());
    };

    // --- 3. STABLE DATA PREDATOR (v4.8.2) ---
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

    // --- 4. THE UI SHIELD (Strictly isolated to /results) ---
    const shield = document.createElement('div');
    Object.assign(shield.style, {
        position: 'fixed', left: '0', bottom: '0', width: '100vw', height: '100px',
        zIndex: '2147483647', display: 'none', cursor: 'pointer', touchAction: 'manipulation'
    });

    const visualBar = document.createElement('div');
    Object.assign(visualBar.style, {
        position: 'absolute', inset: '0', backgroundColor: '#0f0f0f', color: '#ffffff',
        textAlign: 'center', lineHeight: '100px', fontSize: '18px', fontWeight: 'bold',
        fontFamily: 'sans-serif', borderTop: '1px solid #333', pointerEvents: 'none'
    });
    visualBar.innerText = 'TAP TO UNMUTE SEARCH RESULT';
    shield.appendChild(visualBar);
    document.body.appendChild(shield);

    // --- 5. STABLE RESUME HAMMER (v4.8.2) ---
    const startForceResume = (videos) => {
        if (forceResumeTimer) clearInterval(forceResumeTimer);
        let attempts = 0;
        forceResumeTimer = setInterval(() => {
            videos.forEach(v => {
                if (v.muted || v.paused) {
                    v.muted = false;
                    v.volume = 1.0;
                    v.play().catch(() => {});
                }
            });
            if (++attempts > 50) clearInterval(forceResumeTimer);
        }, 10); // Kept at 10ms as per stable version
    };

    shield.addEventListener('touchstart', (e) => {
        e.preventDefault();
        userWantsUnmute = true;
    }, { capture: true, passive: false });

    // --- 6. ISOLATED SEARCH DETECTION LOOP ---
    setInterval(() => {
        const path = window.location.pathname;
        const isSearch = path.startsWith('/results');
        const videos = document.querySelectorAll('video');
        
        // SURGICAL ICON DETECTION:
        // We look for the specific "Mute" renderer YouTube uses for unmutable feed videos
        const unmuteIconVisible = !!document.querySelector('ytm-muted-autoplay-status-renderer') || 
                                 !!document.querySelector('.ytm-autonav-toggle-button') ||
                                 !!document.querySelector('[aria-label*="unmute"]');

        if (isSearch && unmuteIconVisible && videos.length > 0 && !userWantsUnmute) {
            shield.style.display = 'block';
        } else {
            shield.style.display = 'none';
        }

        if (userWantsUnmute) {
            startForceResume(videos);
            userWantsUnmute = false;
            // Temporary hide to allow playback to settle
            setTimeout(() => { userWantsUnmute = false; }, 2000);
        }
    }, 50);
})();
