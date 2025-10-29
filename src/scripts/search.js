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
  if (postCards.length === 0) {
    searchInput.dataset.searchBound = 'true';
    return;
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

  let currentTag = 'all';

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
    if (currentTag === 'all') {
      indicator.classList.add('hidden');
      indicator.textContent = '';
    } else {
      indicator.classList.remove('hidden');
      indicator.textContent = `Filtering by tag: #${labelLookup.get(currentTag) ?? currentTag}`;
    }
  };

  const setActiveTagButton = (tag) => {
    tagButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.filterTag === tag ? 'true' : 'false');
    });
  };

  const passesTag = (card) => {
    if (currentTag === 'all') return true;
    try {
      const tags = JSON.parse(card.dataset.tags || '[]');
      return Array.isArray(tags) && tags.includes(currentTag);
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
      currentTag = currentTag === tag ? 'all' : tag;
      setActiveTagButton(currentTag);
      updateIndicator();
      performSearch();
    });
  });

  setActiveTagButton('all');
  updateIndicator();
  render();

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
