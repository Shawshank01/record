const anchors = document.querySelectorAll('a[href^="http"]');
anchors.forEach((anchor) => {
    const url = new URL((anchor as HTMLAnchorElement).href, window.location.origin);
    const isExternal = url.hostname !== window.location.hostname;
    if (isExternal) {
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', anchor.getAttribute('rel') ?? 'noopener');
    }
});
