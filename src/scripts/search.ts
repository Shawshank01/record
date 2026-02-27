export { };

declare global {
  interface Window {
    __MICHIFUMI_POSTS__?: PostItem[];
  }
}

interface PostItem {
  id: string;
  title?: string;
  description?: string;
  body?: string;
  tags?: string[];
}

const normalise = (text = ''): string => text.toString().toLowerCase();

const getPayload = (): PostItem[] => {
  const globalPayload = window.__MICHIFUMI_POSTS__;
  if (Array.isArray(globalPayload)) {
    return globalPayload;
  }

  const dataTag = document.getElementById('search-data');
  if (!dataTag) return [];

  try {
    const parsed = JSON.parse(dataTag.textContent || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const searchDocuments = (payload: PostItem[], query: string): { id: string }[] | undefined => {
  const needle = normalise(query);
  if (!needle) return undefined;

  return payload
    .filter((item) => {
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const tagMatches = tags.some((tag) => normalise(tag).includes(needle));
      return (
        [item.title, item.description, item.body].some(
          (field) => normalise(field ?? '').includes(needle)
        ) || tagMatches
      );
    })
    .map((item) => ({ id: item.id }));
};

const initTagMenus = (): void => {
  const sidebars = document.querySelectorAll<HTMLElement>('[data-tag-sidebar]');
  sidebars.forEach((sidebar) => {
    const toggle = sidebar.querySelector<HTMLElement>('[data-tag-toggle]');
    const menu = sidebar.querySelector<HTMLElement>('[data-tag-menu]');

    if (!toggle || !menu || toggle.dataset.bound === 'true') return;

    const setOpenState = (isOpen: boolean): void => {
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) {
        menu.classList.remove('hidden');
        menu.classList.add('flex');
      } else {
        menu.classList.remove('flex');
        menu.classList.add('hidden');
      }
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      setOpenState(!isOpen);
    });

    setOpenState(false);
    toggle.dataset.bound = 'true';
  });
};

const initSearchRedirect = (searchInput: HTMLInputElement): void => {
  searchInput.placeholder = 'Search… ↵';
  searchInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      window.location.href = query ? `/?q=${encodeURIComponent(query)}` : '/';
    }
  });
  searchInput.dataset.searchBound = 'true';
};

const initSearchFull = (
  searchInput: HTMLInputElement,
  postCards: HTMLElement[]
): void => {
  // Read and consume query param
  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery) {
    searchInput.value = initialQuery;
    window.history.replaceState({}, '', window.location.pathname);
  }

  const tagButtons = Array.from(document.querySelectorAll<HTMLElement>('.tag-filter'));
  const indicator = document.getElementById('active-tag-indicator');
  const emptyState = document.getElementById('no-results');

  // Build label lookup from tag buttons
  const labelLookup = new Map<string, string>();
  tagButtons.forEach((btn) => {
    const key = btn.dataset.filterTag ?? '';
    if (key) labelLookup.set(key, btn.dataset.filterLabel ?? key);
  });
  labelLookup.set('all', 'All');

  const payload = getPayload();
  if (payload.length === 0) {
    searchInput.dataset.searchBound = 'true';
    return;
  }

  // Pre-parse card tags once instead of on every filter pass
  const cardTagsCache = new Map<HTMLElement, string[]>();
  postCards.forEach((card) => {
    try {
      const tags = JSON.parse(card.dataset.tags || '[]');
      cardTagsCache.set(card, Array.isArray(tags) ? tags : []);
    } catch {
      cardTagsCache.set(card, []);
    }
  });

  const selectedTags = new Set<string>();

  const passesTag = (card: HTMLElement): boolean => {
    if (selectedTags.size === 0) return true;
    const tags = cardTagsCache.get(card) ?? [];
    return tags.some((t) => selectedTags.has(t));
  };

  const render = (matches: { id: string }[] | undefined): void => {
    const matchIds = new Set((matches ?? []).map((r) => r.id));
    let visibleCount = 0;

    postCards.forEach((card) => {
      const shouldShow = (!matches || matchIds.has(card.dataset.postId || '')) && passesTag(card);
      card.classList.toggle('hidden', !shouldShow);
      if (shouldShow) visibleCount += 1;
    });

    emptyState?.classList.toggle('hidden', visibleCount !== 0);
  };

  const updateIndicator = (): void => {
    if (!indicator) return;
    if (selectedTags.size === 0) {
      indicator.classList.add('hidden');
      indicator.textContent = '';
    } else {
      indicator.classList.remove('hidden');
      const tagLabels = Array.from(selectedTags).map((t) => `#${labelLookup.get(t) ?? t}`);
      const prefix = selectedTags.size === 1 ? 'Filtering by tag:' : 'Filtering by tags:';
      indicator.textContent = `${prefix} ${tagLabels.join(', ')}`;
    }
  };

  const setActiveTagButtons = (): void => {
    tagButtons.forEach((btn) => {
      const tag = btn.dataset.filterTag ?? '';
      const isSelected = tag === 'all' ? selectedTags.size === 0 : selectedTags.has(tag);
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  };

  const performSearch = (): void => {
    const value = searchInput.value.trim();
    render(value ? searchDocuments(payload, value) : undefined);
  };

  // Wire up events
  searchInput.addEventListener('input', performSearch);

  tagButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.filterTag ?? 'all';

      if (tag === 'all') {
        selectedTags.clear();
      } else if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
      } else {
        selectedTags.add(tag);
      }

      setActiveTagButtons();
      updateIndicator();
      performSearch();
    });
  });

  // Initial render
  setActiveTagButtons();
  updateIndicator();
  performSearch();

  searchInput.dataset.searchBound = 'true';
};

const initSearch = (): void => {
  const searchInput = document.getElementById('blog-search') as HTMLInputElement | null;
  if (!searchInput || searchInput.dataset.searchBound === 'true') return;

  const postCards = Array.from(document.querySelectorAll<HTMLElement>('.post-card'));

  if (postCards.length === 0) {
    initSearchRedirect(searchInput);
  } else {
    initSearchFull(searchInput, postCards);
  }
};

const ready = (): void => {
  initTagMenus();
  initSearch();
};

ready();
