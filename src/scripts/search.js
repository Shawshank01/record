const getPayload = () => {
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

const initTagMenus = () => {
  const sidebars = Array.from(document.querySelectorAll('[data-tag-sidebar]'));
  sidebars.forEach((sidebar) => {
    const toggle = sidebar.querySelector('[data-tag-toggle]');
    const menu = sidebar.querySelector('[data-tag-menu]');

    if (!toggle || !menu || toggle.dataset.bound === 'true') {
      return;
    }

    const setOpenState = (isOpen) => {
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menu.classList.toggle('hidden', !isOpen);
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      setOpenState(!isOpen);
    });

    setOpenState(false);
    toggle.dataset.bound = 'true';
  });
};

const initSearch = () => {
  const searchInput = document.getElementById('blog-search');
  if (!searchInput || searchInput.dataset.searchBound === 'true') {
    return;
  }

  const postCards = Array.from(document.querySelectorAll('.post-card'));

  // On pages without post cards (e.g., individual blog posts), redirect to homepage on search
  if (postCards.length === 0) {
    searchInput.placeholder = 'Search… ↵';
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `/?q=${encodeURIComponent(query)}`;
        } else {
          window.location.href = '/';
        }
      }
    });
    searchInput.dataset.searchBound = 'true';
    return;
  }

  // On homepage: read query param and populate search input
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q');
  if (initialQuery) {
    searchInput.value = initialQuery;
    // Clean up URL without reloading
    window.history.replaceState({}, '', window.location.pathname);
  }

  const tagButtons = Array.from(document.querySelectorAll('.tag-filter'));
  const indicator = document.getElementById('active-tag-indicator');
  const emptyState = document.getElementById('no-results');

  const labelLookup = new Map();
  tagButtons.forEach((btn) => {
    const key = btn.dataset.filterTag ?? '';
    if (!key) return;
    const label = btn.dataset.filterLabel ?? key;
    labelLookup.set(key, label);
  });
  labelLookup.set('all', 'All');

  const payload = getPayload();
  if (payload.length === 0) {
    searchInput.dataset.searchBound = 'true';
    return;
  }

  // Use a Set for multi-tag selection
  let selectedTags = new Set();

  const normalise = (text = '') => text.toString().toLowerCase();

  const searchDocuments = (query) => {
    const needle = normalise(query);
    if (!needle) return undefined;

    const results = payload.filter((item) => {
      const title = normalise(item.title ?? '');
      const description = normalise(item.description ?? '');
      const body = normalise(item.body ?? '');
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const tagMatches = tags.some((tag) => normalise(tag).includes(needle));
      return [title, description, body].some((field) => field.includes(needle)) || tagMatches;
    });

    return results.map((item) => ({ id: item.id }));
  };

  const updateIndicator = () => {
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

  const setActiveTagButtons = () => {
    tagButtons.forEach((btn) => {
      const tag = btn.dataset.filterTag ?? '';
      const isAll = tag === 'all';
      const isSelected = isAll ? selectedTags.size === 0 : selectedTags.has(tag);
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  };

  const passesTag = (card) => {
    if (selectedTags.size === 0) return true;
    try {
      const tags = JSON.parse(card.dataset.tags || '[]');
      if (!Array.isArray(tags)) return false;
      // Show post if it matches ANY of the selected tags (OR logic)
      return tags.some((t) => selectedTags.has(t));
    } catch {
      return false;
    }
  };

  const render = (matches) => {
    const matchIds = new Set((matches ?? []).map((result) => result.id));
    let visibleCount = 0;

    postCards.forEach((card) => {
      const shouldShow = (!matches || matchIds.has(card.dataset.postId || '')) && passesTag(card);
      card.classList.toggle('hidden', !shouldShow);
      if (shouldShow) visibleCount += 1;
    });

    if (emptyState) {
      emptyState.classList.toggle('hidden', visibleCount !== 0);
    }
  };

  const performSearch = () => {
    const value = searchInput.value.trim();
    const results = value ? searchDocuments(value) : undefined;
    render(results);
  };

  searchInput.addEventListener('input', performSearch);

  tagButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.filterTag ?? 'all';

      if (tag === 'all') {
        // Clicking "All" clears all selections
        selectedTags.clear();
      } else {
        // Toggle tag in/out of selection
        if (selectedTags.has(tag)) {
          selectedTags.delete(tag);
        } else {
          selectedTags.add(tag);
        }
      }

      setActiveTagButtons();
      updateIndicator();
      performSearch();
    });
  });

  setActiveTagButtons();
  updateIndicator();
  performSearch();

  searchInput.dataset.searchBound = 'true';
};

const ready = () => {
  initTagMenus();
  initSearch();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ready, { once: true });
} else {
  ready();
}

document.addEventListener('astro:page-load', ready);
document.addEventListener('astro:after-swap', ready);
