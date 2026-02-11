const button = document.querySelector('[data-back-to-top]') as HTMLButtonElement | null;
if (button) {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const update = () => {
        const show = window.scrollY > 0;
        button.classList.toggle('opacity-0', !show);
        button.classList.toggle('pointer-events-none', !show);
        button.classList.toggle('translate-y-2', !show);
    };

    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                update();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    update();
}
