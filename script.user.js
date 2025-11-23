// ==UserScript==
// @name         Google Sheets Drag Navigation
// @version      1.0.1
// @description  Middle Mouse Click to drag navigate Google Sheets.
// @author       TURBODRIVER
// @match        *://docs.google.com/spreadsheets/d/*
// @match        *://docs.google.com/spreadsheets/u/*
// ==/UserScript==

(function() {
    'use strict';

    const cssStyle = document.createElement('style');
    cssStyle.textContent = `
        body.gsdn-dragging, body.gsdn-dragging * { cursor: grab !important; }
        body.gsdn-active, body.gsdn-active * { cursor: grabbing !important; }
    `;
    document.head.appendChild(cssStyle);

    let isDragging = false;
    let startX = 0, startY = 0;
    let startScrollLeft = 0, startScrollTop = 0;
    let cachedScrollContainers = null;

    const scrollEaseFactor = 0.3;
    let scrollAnimationFrameId = null;
    let targetScrollLeft = 0;
    let targetScrollTop = 0;
    let toggleScrollAxis = true;

    function getScrollableContainers() {
        if (cachedScrollContainers) {
            if (document.body.contains(cachedScrollContainers.horizontal) && document.body.contains(cachedScrollContainers.vertical)) {
                return cachedScrollContainers;
            }
            cachedScrollContainers = null;
        }

        const container = document.querySelector('#docs-editor-container');

        if (!container) return null;

        const horizontal = container.querySelector('div.native-scrollbar-x');
        const vertical = container.querySelector('div.native-scrollbar-y');

        if (horizontal && vertical) {
            cachedScrollContainers = { horizontal: horizontal, vertical: vertical };
            return cachedScrollContainers;
        }

        return null;
    }

    function animateScrolling() {
        const scrollContainers = getScrollableContainers();

        if (!scrollContainers.horizontal || !scrollContainers.vertical) {
            cancelAnimationFrame(scrollAnimationFrameId);
            scrollAnimationFrameId = null;
            return;
        }

        document.body.classList.add('gsdn-active');

        if (toggleScrollAxis) {
            const horizontalScrollContainer = scrollContainers.horizontal;
            const currentLeft = horizontalScrollContainer.scrollLeft;
            let diffX = targetScrollLeft - currentLeft;

            if (Math.abs(diffX) < 1) {
                diffX = 0
            }

            horizontalScrollContainer.scrollLeft = currentLeft + diffX * scrollEaseFactor;
        } else {
            const verticalScrollContainer = scrollContainers.vertical;
            const currentTop = verticalScrollContainer.scrollTop;
            let diffY = targetScrollTop - currentTop;

            if (Math.abs(diffY) < 1) {
                diffY = 0
            }

            verticalScrollContainer.scrollTop = currentTop + diffY * scrollEaseFactor;
        }
        toggleScrollAxis = !toggleScrollAxis;

        scrollAnimationFrameId = requestAnimationFrame(animateScrolling);
    }

    document.addEventListener('mousedown', function(e) {
        const scrollContainers = getScrollableContainers();

        if (e.button === 1 && scrollContainers) {
            if (!scrollContainers || !scrollContainers.horizontal || !scrollContainers.vertical) {
                return;
            }

            const horizontalScrollContainer = scrollContainers.horizontal;
            const verticalScrollContainer = scrollContainers.vertical;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            startScrollLeft = horizontalScrollContainer.scrollLeft;
            startScrollTop = verticalScrollContainer.scrollTop;

            document.body.classList.add('gsdn-dragging');

            e.stopPropagation();
            e.preventDefault();
        }
    }, true);

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        targetScrollLeft = startScrollLeft - dx;
        targetScrollTop = startScrollTop - dy;

        if (!scrollAnimationFrameId) {
            scrollAnimationFrameId = requestAnimationFrame(animateScrolling);
        }

        e.stopPropagation();
        e.preventDefault();
    }, true);

    document.addEventListener('mouseup', function(e) {
        if (isDragging) {
            isDragging = false;

            document.body.classList.remove('gsdn-active', 'gsdn-dragging');

            if (scrollAnimationFrameId) {
                cancelAnimationFrame(scrollAnimationFrameId);
                scrollAnimationFrameId = null;
            }

            e.stopPropagation();
            e.preventDefault();
        }
    }, true);

    document.addEventListener('contextmenu', function(e) {
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

})();
