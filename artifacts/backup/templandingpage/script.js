document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.16, rootMargin: '0px 0px -10% 0px' }
    );
    revealElements.forEach((el) => revealObserver.observe(el));

    const counters = document.querySelectorAll('[data-counter]');
    const counterObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const el = entry.target;
                const target = Number.parseInt(el.getAttribute('data-target') || '0', 10);
                const start = performance.now();
                const duration = 1100;

                const tick = (time) => {
                    const progress = Math.min((time - start) / duration, 1);
                    el.textContent = String(Math.floor(progress * target));
                    if (progress < 1) {
                        requestAnimationFrame(tick);
                    } else {
                        el.textContent = String(target);
                    }
                };

                requestAnimationFrame(tick);
                observer.unobserve(el);
            });
        },
        { threshold: 0.35 }
    );
    counters.forEach((counter) => counterObserver.observe(counter));

    const scoreEl = document.querySelector('[data-dashboard-score]');
    if (scoreEl) {
        const target = Number.parseInt(scoreEl.textContent || '92', 10);
        scoreEl.textContent = '0';
        const start = performance.now();
        const duration = 900;

        const animate = (time) => {
            const progress = Math.min((time - start) / duration, 1);
            scoreEl.textContent = String(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    const tabs = document.querySelectorAll('.dimension-tab');
    const panels = document.querySelectorAll('.dimension-panel');

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target');

            tabs.forEach((t) => {
                const selected = t === tab;
                t.classList.toggle('active', selected);
                t.setAttribute('aria-selected', selected ? 'true' : 'false');
            });

            panels.forEach((panel) => {
                panel.classList.toggle('active', panel.id === targetId);
            });
        });
    });
});
