import './style.css';
import albums from './albums.json';

const state = { genre: 'All', sort: 'title' };

const genresEl = document.getElementById('genres');
const sortEl = document.getElementById('sort');
const listEl = document.getElementById('albums');
const countEl = document.getElementById('count');

// Ignore a leading "The" when sorting, so The Cars sits under C
const sortKey = (s) => s.replace(/^the\s+/i, '').toLowerCase();

const sorters = {
  title: (a, b) => sortKey(a.title).localeCompare(sortKey(b.title)),
  artist: (a, b) => sortKey(a.artist).localeCompare(sortKey(b.artist)) || a.year - b.year,
  'year-asc': (a, b) => a.year - b.year,
  'year-desc': (a, b) => b.year - a.year,
};

// Genres ordered by how many albums carry them, then alphabetically
function genreList() {
  const counts = new Map();
  for (const album of albums) {
    for (const g of album.genres) counts.set(g, (counts.get(g) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([g]) => g);
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'style') for (const [prop, val] of Object.entries(v)) node.style.setProperty(prop, val);
    else node.setAttribute(k, v);
  }
  for (const child of children.flat()) {
    if (child != null && child !== '') node.append(child);
  }
  return node;
}

function renderChips() {
  genresEl.replaceChildren(
    ...['All', ...genreList()].map((g) =>
      el(
        'button',
        { type: 'button', class: 'chip', 'aria-pressed': String(g === state.genre), 'data-genre': g },
        g,
      ),
    ),
  );
}

function cover(album) {
  const [bg, fg] = album.colors;
  return el(
    'div',
    { class: 'cover', style: { '--bg': bg, '--fg': fg }, 'aria-hidden': 'true' },
    el('span', { class: 'cover-artist' }, album.artist),
    el('span', { class: 'cover-title' }, album.title),
    el('span', { class: 'record' }),
  );
}

function card(album) {
  return el(
    'li',
    { class: 'card' },
    cover(album),
    el(
      'div',
      { class: 'card-body' },
      el('h2', { class: 'title' }, album.title),
      el('p', { class: 'meta' }, album.artist, el('span', { class: 'dot' }, ' · '), String(album.year)),
      album.why ? el('p', { class: 'why' }, album.why) : null,
      el('ul', { class: 'tags', 'aria-label': 'Genres' }, album.genres.map((g) => el('li', {}, g))),
      el('p', { class: 'copies' }, 'On my shelf: ', album.copies.join(' · ')),
    ),
  );
}

function render() {
  const shown = albums
    .filter((a) => state.genre === 'All' || a.genres.includes(state.genre))
    .sort(sorters[state.sort]);

  listEl.replaceChildren(...shown.map(card));
  countEl.textContent =
    state.genre === 'All'
      ? `${shown.length} albums`
      : `${shown.length} of ${albums.length} albums · ${state.genre}`;

  for (const chip of genresEl.children) {
    chip.setAttribute('aria-pressed', String(chip.dataset.genre === state.genre));
  }
}

genresEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  state.genre = chip.dataset.genre;
  render();
});

sortEl.addEventListener('change', () => {
  state.sort = sortEl.value;
  render();
});

renderChips();
render();
