let cleanupToc: (() => void) | null = null;

export function initToc() {
    // Teardown previous listeners if re-initialised (e.g. Astro View Transitions)
    if (cleanupToc) {
        cleanupToc();
        cleanupToc = null;
    }

    const desktopLinks = document.querySelectorAll<HTMLAnchorElement>("a[data-toc-link]");
    const mobileLinks = document.querySelectorAll<HTMLAnchorElement>("[data-toc-mobile-link]");

    if (desktopLinks.length === 0 && mobileLinks.length === 0) return;

    const controller = new AbortController();
    const { signal } = controller;

    // Immediately guarantee cleanup regardless of where subsequent code returns
    cleanupToc = () => {
        controller.abort();
    };

    // Auto-close mobile dropdown when a heading link is clicked
    mobileLinks.forEach((link) => {
        link.addEventListener(
            "click",
            () => {
                const details = link.closest("details");
                if (details) details.removeAttribute("open");
            },
            { signal },
        );
    });

    // Map existing links by ID to avoid querySelector selector-escaping vulnerabilities
    const desktopMap = new Map<string, HTMLAnchorElement>();
    desktopLinks.forEach((link) => {
        const slug = link.getAttribute("data-toc-link");
        if (slug) desktopMap.set(slug, link);
    });

    const mobileMap = new Map<string, HTMLAnchorElement>();
    mobileLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
            mobileMap.set(href.slice(1), link);
        }
    });

    const navContainer = document.querySelector<HTMLElement>(".toc-sidebar nav");
    const headingMap = new Map<
        string,
        { heading: HTMLElement; desktop?: HTMLAnchorElement; mobile?: HTMLAnchorElement }
    >();
    const headings: HTMLElement[] = [];

    // Query headings in natural document order directly from the article section
    const headingElements = document.querySelectorAll<HTMLElement>(
        "article section h2[id], article section h3[id]",
    );

    headingElements.forEach((h) => {
        const id = h.id;
        const dLink = desktopMap.get(id);
        const mLink = mobileMap.get(id);

        if (dLink || mLink) {
            headingMap.set(id, { heading: h, desktop: dLink, mobile: mLink });
            headings.push(h);
        }
    });

    if (headings.length === 0) return;

    let activeId: string | null = null;

    const setActive = (id: string | null) => {
        if (activeId === id) return;

        // Clear previous active states
        if (activeId) {
            const prev = headingMap.get(activeId);
            prev?.desktop?.removeAttribute("aria-current");
            prev?.mobile?.removeAttribute("aria-current");
        }

        activeId = id;

        if (activeId) {
            const curr = headingMap.get(activeId);
            curr?.desktop?.setAttribute("aria-current", "location");
            curr?.mobile?.setAttribute("aria-current", "location");

            if (curr?.desktop && navContainer) {
                const navRect = navContainer.getBoundingClientRect();
                const linkRect = curr.desktop.getBoundingClientRect();
                if (linkRect.top < navRect.top || linkRect.bottom > navRect.bottom) {
                    curr.desktop.scrollIntoView({ block: "nearest" });
                }
            }
        }
    };

    let ticking = false;

    const updateActiveHeading = () => {
        const headerOffset = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue("--header-offset") || "128",
            10,
        );
        const threshold = headerOffset + 40;

        // Bottom-of-page check: if scrolled to bottom, activate the last heading
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50) {
            const last = headings[headings.length - 1];
            if (last) setActive(last.id);
            return;
        }

        // Live viewport-relative calculation via getBoundingClientRect()
        let current: HTMLElement | null = null;
        for (let i = 0; i < headings.length; i++) {
            const rect = headings[i].getBoundingClientRect();
            if (rect.top <= threshold) {
                current = headings[i];
            } else {
                break;
            }
        }

        setActive(current ? current.id : (headings[0] ? headings[0].id : null));
    };

    const onScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateActiveHeading();
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener("scroll", onScroll, { passive: true, signal });
    window.addEventListener("resize", onScroll, { passive: true, signal });
    window.addEventListener("load", onScroll, { passive: true, signal });

    // Initial check
    updateActiveHeading();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initToc);
} else {
    initToc();
}

document.addEventListener("astro:page-load", initToc);
