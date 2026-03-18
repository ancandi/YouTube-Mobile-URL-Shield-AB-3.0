// ==UserScript==
// @name YouTube Mobile URL Shield AB+
// @namespace http://tampermonkey.com/
// @version 3.1
// @description Total Data Blockade + Persistent Unmute Shield
// @author ancandi
// @run-at document-start
// @match https://*.youtube.com/*
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. THE REDIRECT ENGINE ---
    const checkHistoryHole = () => {
        if (sessionStorage.getItem('yt-ad-reload-active') === 'true' && window.location.pathname.startsWith('/watch')) {
            window.location.replace(window.location.href);
        }
    };
    checkHistoryHole();

    // --- 2. MAX DATA LOCKDOWN ---
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
        const observer = new MutationObserver(() => {
            document.querySelectorAll('img, image').forEach(img => img.remove());
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // --- 3. THE REINFORCED SHIELD (Persistent Logic) ---
    const shield = document.createElement('div');
    shield.id = 'reloader-unmute-shield';
    
    Object.assign(shield.style, {
        position: 'fixed', left: '0', width: '100vw', backgroundColor: 'transparent', 
        zIndex: '2147483647', display: 'none', cursor: 'pointer',
        touchAction: 'none', pointerEvents: 'auto'
    });

    const visualBar = document.createElement('div');
    Object.assign(visualBar.style, {
        position: 'absolute', bottom: '0', left: '0', width: '100%', height: '100px',
        backgroundColor: '#ffffff', color: '#000000', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '18px',
        fontWeight: 'bold', fontFamily: 'sans-serif', boxShadow: '0 -10px 20px rgba(0,0,0,0.3)',
        pointerEvents: 'none'
    });
    visualBar.innerText = 'TAP TO UNMUTE';
    shield.appendChild(visualBar);

    const handleInteraction = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }

        const video = document.querySelector('video');
        if (video) {
            video.muted = false;
            video.volume = 1.0;
            video.play().catch(() => { video.play(); });
        }
        
        // Hide immediately on tap, but do not set a "permanent" cleared flag
        shield.style.display = 'none';
        return false;
    };

    ['touchstart', 'touchend', 'click', 'mousedown'].forEach(evt => {
        shield.addEventListener(evt, handleInteraction, { capture: true, passive: false });
    });

    // --- 4. MONETIZATION-KILL ---
    let reloadTriggered = false;
    const strictMonKill = () => {
        if (!window.location.pathname.startsWith('/watch') || reloadTriggered) return;
        const ad = document.querySelector('.ad-showing, .ad-interrupting');
        const video = document.querySelector('video');

        if (ad && video) {
            video.muted = true;
            video.pause(); 
            if (!isNaN(video.duration) && video.duration > 0 && video.readyState >= 1) {
                reloadTriggered = true;
                sessionStorage.setItem('yt-ad-reload-active', 'true');
                history.replaceState(null, "", window.location.href);
                window.location.replace(window.location.href); 
            }
        }
    };

    // --- 5. MAINTENANCE LOOP (Dynamic & Persistent) ---
    setInterval(() => {
        const isWatch = window.location.pathname.startsWith('/watch');
        const video = document.querySelector('video');

        // Layout Logic
        if (isWatch) {
            shield.style.top = '0'; 
            shield.style.height = '100vh';
            strictMonKill();
        } else {
            // On homepage/shorts-feed, keep hitbox limited to the white bar area
            shield.style.top = 'auto'; 
            shield.style.bottom = '0'; 
            shield.style.height = '100px'; 
            sessionStorage.removeItem('yt-ad-reload-active');
        }

        // UI Restoration logic for reloads
        if (!document.querySelector('.ad-showing') && sessionStorage.getItem('yt-ad-reload-active') === 'true') {
            sessionStorage.removeItem('yt-ad-reload-active');
            const saver = document.getElementById('yt-hard-blocker');
            if (saver) saver.remove();
        }

        // PERSISTENCE LOGIC: 
        // If a video exists and it is muted (standard for mobile autoplay/shorts), show shield.
        // If no video or unmuted, hide shield.
        if (video && video.muted && !document.querySelector('.ad-showing')) {
            if (!document.getElementById('reloader-unmute-shield')) {
                document.body.appendChild(shield);
            }
            shield.style.display = 'flex';
        } else {
            shield.style.display = 'none';
        }

    }, 100); // Efficient polling

    window.addEventListener('popstate', () => {
        reloadTriggered = false;
    });

})();