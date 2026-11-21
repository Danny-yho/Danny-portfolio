document.addEventListener('DOMContentLoaded', async () => {
  const controls = {
    search: document.getElementById('search'),
    category: document.getElementById('category'),
    size: document.getElementById('size'),
    sort: document.getElementById('sort'),
    minPrice: document.getElementById('minPrice'),
    maxPrice: document.getElementById('maxPrice')
  };
  const productsHost = document.getElementById('products');
  const countHost = document.getElementById('resultCount');
  const paginationHost = document.getElementById('pagination');
  let page = 1;
  let requestNumber = 0;
  let searchTimer;

  controls.category.value = new URLSearchParams(location.search).get('category') || '';

  function renderPagination(pagination) {
    if (!pagination || pagination.pages < 2) {
      paginationHost.innerHTML = '';
      return;
    }
    const buttons = [];
    for (let number = 1; number <= pagination.pages; number += 1) {
      buttons.push(`<button type="button" class="page-button ${number === page ? 'active' : ''}" data-page="${number}" ${number === page ? 'aria-current="page"' : ''}>${number}</button>`);
    }
    paginationHost.innerHTML = `<button type="button" class="page-button" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous page">‹</button>${buttons.join('')}<button type="button" class="page-button" data-page="${page + 1}" ${page === pagination.pages ? 'disabled' : ''} aria-label="Next page">›</button>`;
  }

  async function render() {
    const currentRequest = ++requestNumber;
    const minimum = Number(controls.minPrice.value || 0);
    const maximum = Number(controls.maxPrice.value || Infinity);
    if (maximum < minimum) {
      countHost.textContent = 'Maximum price must be greater than or equal to minimum price.';
      productsHost.innerHTML = '';
      paginationHost.innerHTML = '';
      return;
    }

    productsHost.setAttribute('aria-busy', 'true');
    const query = new URLSearchParams({
      page: String(page),
      limit: '12',
      sort: controls.sort.value
    });
    if (controls.search.value.trim()) query.set('search', controls.search.value.trim());
    if (controls.category.value) query.set('category', controls.category.value);
    if (controls.size.value) query.set('size', controls.size.value);
    if (controls.minPrice.value) query.set('minPrice', controls.minPrice.value);
    if (controls.maxPrice.value) query.set('maxPrice', controls.maxPrice.value);

    try {
      const result = await api(`/products?${query}`);
      if (currentRequest !== requestNumber) return;
      const products = result.products || [];
      const pagination = result.pagination;
      const firstItem = products.length ? (page - 1) * pagination.limit + 1 : 0;
      const lastItem = firstItem + products.length - 1;
      countHost.textContent = `Showing ${firstItem}–${lastItem} of ${pagination.total} ${pagination.total === 1 ? 'style' : 'styles'}`;
      productsHost.innerHTML = products.length
        ? products.map(productCard).join('')
        : '<div class="glass p-5 text-center empty-results"><h2>No styles match those filters</h2><p>Try another size or price range, or clear filters to see everything.</p><button class="btn btn-glossy" type="button" data-clear-filters>Show all styles</button></div>';
      renderPagination(pagination);
    } catch (error) {
      if (currentRequest !== requestNumber) return;
      countHost.textContent = 'We could not load styles right now. Please try again.';
      productsHost.innerHTML = `<div class="glass p-4 text-center empty-results">${error.message}</div>`;
      paginationHost.innerHTML = '';
    } finally {
      if (currentRequest === requestNumber) productsHost.removeAttribute('aria-busy');
    }
  }

  function applyFilters() {
    page = 1;
    render();
  }

  controls.search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilters, 250);
  });
  [controls.category, controls.size, controls.sort, controls.minPrice, controls.maxPrice]
    .forEach(control => control.addEventListener(control.tagName === 'SELECT' ? 'change' : 'input', applyFilters));
  document.getElementById('clearFilters').addEventListener('click', () => {
    Object.values(controls).forEach(control => { control.value = ''; });
    controls.sort.value = 'newest';
    history.replaceState(null, '', location.pathname);
    applyFilters();
  });
  paginationHost.addEventListener('click', event => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    page = Number(button.dataset.page);
    render();
    document.getElementById('main').scrollIntoView({ behavior: 'smooth' });
  });
  productsHost.addEventListener('click', event => {
    if (event.target.closest('[data-clear-filters]')) document.getElementById('clearFilters').click();
  });
  await render();
});
