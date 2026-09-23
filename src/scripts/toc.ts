function initToc() {
    const mobileLinks = document.querySelectorAll<HTMLAnchorElement>(
        "[data-toc-mobile-link]",
    );
    const desktopLinks = document.querySelectorAll<HTMLAnchorElement>(
        "a[data-toc-link]",
    );

    // Auto-close mobile dropdown when a heading link is clicked
    mobileLinks.forEach((link) => {
        link.addEventListener("click", () => {
            const details = link.closest("details");
            if (details) {
                details.removeAttribute("open");
            }
        });
    });

    if (desktopLinks.length === 0) return;

    const navContainer = document.querySelector<HTMLElement>(".toc-sidebar nav");
    const headingLinkMap = new Map<string, HTMLAnchorElement>();
    const headings: HTMLElement[] = [];

    desktopLinks.forEach((link) => {
        const slug = link.getAttribute("data-toc-link");
        if (!slug) return;
        const target = document.getElementById(slug);
        if (target) {
            headingLinkMap.set(slug, link);
            headings.push(target);
        }
    });

    if (headings.length === 0) return;

    // Ensure headings are sorted by vertical document position
    headings.sort((a, b) => a.offsetTop - b.offsetTop);

    let activeLink: HTMLAnchorElement | null = null;

    const setActive = (link: HTMLAnchorElement | null) => {
        if (activeLink === link) return;
        if (activeLink) {
            activeLink.removeAttribute("aria-current");
        }
        activeLink = link;
        if (activeLink) {
            activeLink.setAttribute("aria-current", "true");
            if (navContainer) {
                const navRect = navContainer.getBoundingClientRect();
                const linkRect = activeLink.getBoundingClientRect();
                if (linkRect.top < navRect.top || linkRect.bottom > navRect.bottom) {
                    activeLink.scrollIntoView({ block: "nearest" });
                }
            }
        }
    };

    let ticking = false;

    const updateActiveHeading = () => {
        const scrollY = window.scrollY;
        const headerOffset = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
                "--header-offset",
            ) || "128",
            10,
        );
        const activationPoint = scrollY + headerOffset + 40;

        // If reader is near the very bottom of the page, select the last heading
        if (
            window.innerHeight + scrollY >=
            document.documentElement.scrollHeight - 50
        ) {
            const last = headings[headings.length - 1];
            if (last) {
                setActive(headingLinkMap.get(last.id) || null);
                return;
            }
        }

        let currentActive: HTMLAnchorElement | null = null;
        for (let i = 0; i < headings.length; i++) {
            const heading = headings[i];
            if (heading.offsetTop <= activationPoint) {
                currentActive = headingLinkMap.get(heading.id) || null;
            } else {
                break;
            }
        }

        setActive(currentActive);
    };

    const handleScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateActiveHeading();
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Initial check
    updateActiveHeading();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initToc);
} else {
    initToc();
}
