(function () {
    // Curated Showcase embeds (YouTube or SoundCloud URLs). Edit this list freely.
    const SHOWCASE_EMBEDS = [
        'https://www.youtube.com/watch?v=F5sANEAdu48',
        'https://www.youtube.com/watch?v=gMKBPfTLTrw',
        'https://www.youtube.com/watch?v=oB0ZOjURhtI',
        'https://www.youtube.com/watch?v=S5NM49ZmhBA',
        'https://www.youtube.com/watch?v=6_sn7v1ZNyM',
        'https://www.youtube.com/watch?v=LNTI7ahgT9A',
        'https://www.youtube.com/watch?v=J3gck0zUsZ8',
        'https://www.youtube.com/watch?v=yr8Aeit0-c0',
        'https://www.youtube.com/watch?v=BQX0gmjXTQk',
        'https://www.youtube.com/watch?v=BREJGZNAZYs',
        'https://www.youtube.com/watch?v=TrKGXwDSgL0',
        'https://www.youtube.com/watch?v=_LWvRlkzbTE',
        'https://www.youtube.com/watch?v=5mFpaR5GxJk',
        'https://www.youtube.com/watch?v=udI2aeGDVj0',
        'https://www.youtube.com/watch?v=e-vgVu-unrM',
        'https://www.youtube.com/watch?v=_8AkEJ4_ekE',
    ];

    const ROW_COUNT = 4;
    const STEP_MS = 5000;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tabJournal = document.getElementById('tab-journal');
    const tabShowcase = document.getElementById('tab-showcase');
    const panelJournal = document.getElementById('music-journal');
    const panelShowcase = document.getElementById('music-showcase');

    if (!tabJournal || !tabShowcase || !panelJournal || !panelShowcase) return;

    let mounted = false;
    let timerId = null;
    let stepping = false;
    const rows = [];

    function youtubeId(url) {
        const m = url.match(
            /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/
        );
        return m ? m[1] : null;
    }

    function resolveEmbed(url) {
        const id = youtubeId(url);
        if (id) {
            return {
                kind: 'youtube',
                src: 'https://www.youtube-nocookie.com/embed/' + id,
            };
        }
        if (/soundcloud\.com|w\.soundcloud\.com/.test(url)) {
            const playerUrl = url.includes('w.soundcloud.com/player')
                ? url
                : 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url);
            return { kind: 'soundcloud', src: playerUrl };
        }
        return null;
    }

    function createCard(embed) {
        const card = document.createElement('div');
        card.className = 'music-showcase-card';

        const wrap = document.createElement('div');
        wrap.className = 'video-wrapper';

        const iframe = document.createElement('iframe');
        iframe.className = embed.kind === 'youtube' ? 'embed-youtube' : 'embed-soundcloud';
        iframe.dataset.src = embed.src;
        iframe.title = 'Music embed';
        iframe.loading = 'lazy';

        wrap.appendChild(iframe);
        card.appendChild(wrap);
        return card;
    }

    function cardStep(state) {
        const card = state.track.querySelector('.music-showcase-card');
        if (!card) return 0;
        const styles = getComputedStyle(state.track);
        const gap = parseFloat(styles.columnGap || styles.gap) || 0;
        // Use rendered card width so step matches layout (same size on 3- and 4-card rows)
        const cardWidth = card.getBoundingClientRect().width;
        return cardWidth > 0 ? cardWidth + gap : 0;
    }

    function setTransform(track, px, animate) {
        track.classList.toggle('is-animating', !!animate);
        track.style.transform = 'translateX(' + px + 'px)';
    }

    function buildRows() {
        const embeds = SHOWCASE_EMBEDS.map(resolveEmbed).filter(Boolean);
        if (!embeds.length) return;

        const buckets = Array.from({ length: ROW_COUNT }, () => []);
        embeds.forEach((embed, i) => {
            buckets[i % ROW_COUNT].push(embed);
        });

        panelShowcase.replaceChildren();
        rows.length = 0;

        buckets.forEach((bucket, rowIndex) => {
            if (!bucket.length) return;

            const isOdd = rowIndex % 2 === 1;
            const cardCount = isOdd ? 3 : 4;

            const row = document.createElement('div');
            row.className = 'music-showcase-row' + (isOdd ? ' music-showcase-row--odd' : '');

            const track = document.createElement('div');
            track.className = 'music-showcase-track';

            const source = bucket.slice();
            for (let i = 0; i < cardCount; i += 1) {
                track.appendChild(createCard(source[i % source.length]));
            }

            row.appendChild(track);
            panelShowcase.appendChild(row);
            rows.push({
                track,
                direction: isOdd ? -1 : 1,
                base: 0,
            });
        });

        if (typeof window.observeMusicEmbeds === 'function') {
            window.observeMusicEmbeds(panelShowcase);
        }
    }

    function stepRow(state) {
        const { track, direction } = state;
        const step = cardStep(state);
        if (!step || track.children.length < 2) return Promise.resolve();

        const from = state.base;
        const to = from + direction * step;

        return new Promise((resolve) => {
            let done = false;
            const finish = () => {
                if (done) return;
                done = true;
                track.removeEventListener('transitionend', onEnd);
                clearTimeout(fallback);

                if (direction > 0) {
                    track.insertBefore(track.lastElementChild, track.firstElementChild);
                } else {
                    track.appendChild(track.firstElementChild);
                }

                setTransform(track, from, false);
                void track.offsetWidth;
                resolve();
            };

            const onEnd = (event) => {
                if (event.target !== track || event.propertyName !== 'transform') return;
                finish();
            };

            const fallback = window.setTimeout(finish, 700);
            track.addEventListener('transitionend', onEnd);
            setTransform(track, to, true);
        });
    }

    async function tick() {
        if (stepping || panelShowcase.hidden || document.hidden || reduceMotion) return;
        stepping = true;
        try {
            await Promise.all(rows.map(stepRow));
        } finally {
            stepping = false;
        }
    }

    function startTimer() {
        stopTimer();
        if (reduceMotion || panelShowcase.hidden || !rows.length) return;
        timerId = window.setInterval(tick, STEP_MS);
    }

    function stopTimer() {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
    }

    function ensureMounted() {
        if (mounted) {
            if (rows.length) startTimer();
            return;
        }
        mounted = true;
        requestAnimationFrame(() => {
            buildRows();
            if (!panelShowcase.hidden) startTimer();
        });
    }

    function activateTab(which) {
        const isJournal = which === 'journal';

        tabJournal.setAttribute('aria-selected', String(isJournal));
        tabShowcase.setAttribute('aria-selected', String(!isJournal));
        tabJournal.tabIndex = isJournal ? 0 : -1;
        tabShowcase.tabIndex = isJournal ? -1 : 0;

        panelJournal.hidden = !isJournal;
        panelShowcase.hidden = isJournal;

        if (isJournal) {
            stopTimer();
        } else {
            ensureMounted();
        }
    }

    tabJournal.addEventListener('click', () => activateTab('journal'));
    tabShowcase.addEventListener('click', () => activateTab('showcase'));

    tabJournal.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            tabShowcase.focus();
            activateTab('showcase');
        }
    });
    tabShowcase.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            tabJournal.focus();
            activateTab('journal');
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopTimer();
        else if (!panelShowcase.hidden) startTimer();
    });

    window.addEventListener('resize', () => {
        if (!mounted || panelShowcase.hidden) return;
        rows.forEach((state) => {
            setTransform(state.track, state.base, false);
        });
    });
})();
