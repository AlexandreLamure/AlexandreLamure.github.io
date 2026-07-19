(function () {
    const youtubeAllow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

    function applyDefaults(iframe) {
        if (iframe.classList.contains('embed-youtube')) {
            iframe.allow = youtubeAllow;
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        } else if (iframe.classList.contains('embed-soundcloud')) {
            iframe.allow = 'autoplay; unload';
        }
    }

    function loadIframe(iframe) {
        applyDefaults(iframe);
        iframe.src = iframe.dataset.src;
        iframe.removeAttribute('data-src');
    }

    let observer = null;

    function observeEmbeds(root) {
        const scope = root || document;
        const iframes = scope.querySelectorAll
            ? scope.querySelectorAll('.embed-youtube[data-src], .embed-soundcloud[data-src]')
            : [];

        if (!iframes.length) return;

        if (!('IntersectionObserver' in window)) {
            iframes.forEach(loadIframe);
            return;
        }

        if (!observer) {
            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        loadIframe(entry.target);
                        observer.unobserve(entry.target);
                    });
                },
                { rootMargin: '200px' }
            );
        }

        iframes.forEach((iframe) => observer.observe(iframe));
    }

    window.observeMusicEmbeds = observeEmbeds;
    observeEmbeds(document);
})();
