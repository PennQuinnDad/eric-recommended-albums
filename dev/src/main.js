import './style.css';
import albums from './albums.json';

const state = { genre: 'All', sort: 'year-desc', query: '' };

const searchEl = document.getElementById('search');
const genresEl = document.getElementById('genres');
const sortEl = document.getElementById('sort');
const copyEl = document.getElementById('copy-md');
const listEl = document.getElementById('albums');
const countEl = document.getElementById('count');

// Lowercase and strip accents/punctuation so "freewheelin" finds "Freewheelin'"
// and "whats the story" finds "(What's the Story)"
const normalize = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// The year range in the description always matches the oldest and newest albums
const years = albums.map((a) => a.year);
document.getElementById('year-min').textContent = Math.min(...years);
document.getElementById('year-max').textContent = Math.max(...years);

for (const album of albums) {
  album.searchText = normalize([album.title, album.artist, album.year, ...album.genres].join(' '));
}

// Every word typed must appear somewhere in the album's title, artist, year or genres
function matchesQuery(album) {
  const words = normalize(state.query).split(' ').filter(Boolean);
  return words.every((w) => album.searchText.includes(w));
}

// Ignore leading punctuation and "The" when sorting, so The Cars sits under C
// and (What's the Story) Morning Glory? under W
const sortKey = (s) => s.replace(/^[^a-z0-9]+/i, '').replace(/^the\s+/i, '').toLowerCase();

const sorters = {
  title: (a, b) => sortKey(a.title).localeCompare(sortKey(b.title)),
  artist: (a, b) => sortKey(a.artist).localeCompare(sortKey(b.artist)) || a.year - b.year,
  // Albums from the same year fall back to title order
  'year-asc': (a, b) => a.year - b.year || sortKey(a.title).localeCompare(sortKey(b.title)),
  'year-desc': (a, b) => b.year - a.year || sortKey(a.title).localeCompare(sortKey(b.title)),
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

const services = [
  { key: 'spotify', label: 'Spotify', class: 'listen-spotify' },
  { key: 'appleMusic', label: 'Apple Music', class: 'listen-apple' },
];

function listenLinks(album) {
  return el(
    'div',
    { class: 'listen' },
    services.map((s) =>
      el(
        'a',
        {
          class: `listen-btn ${s.class}`,
          href: album.links[s.key],
          target: '_blank',
          rel: 'noopener',
          'aria-label': `Listen to ${album.title} on ${s.label}`,
        },
        el('span', { class: 'play', 'aria-hidden': 'true' }),
        s.label,
      ),
    ),
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
      listenLinks(album),
    ),
  );
}

function visibleAlbums() {
  return albums
    .filter((a) => state.genre === 'All' || a.genres.includes(state.genre))
    .filter(matchesQuery)
    .sort(sorters[state.sort]);
}

function render() {
  const shown = visibleAlbums();

  listEl.replaceChildren(
    ...(shown.length
      ? shown.map(card)
      : [el('li', { class: 'empty' }, 'No albums match. Try a different search or genre.')]),
  );

  const filters = [state.genre !== 'All' && state.genre, state.query.trim() && `“${state.query.trim()}”`].filter(Boolean);
  countEl.textContent = filters.length
    ? `${shown.length} of ${albums.length} albums · ${filters.join(' · ')}`
    : `${shown.length} albums`;

  copyEl.disabled = shown.length === 0;

  for (const chip of genresEl.children) {
    chip.setAttribute('aria-pressed', String(chip.dataset.genre === state.genre));
  }
}

// The albums on screen as a Markdown list, ready to paste into a doc or an AI agent
function toMarkdown(list) {
  const filtered = list.length !== albums.length;
  const lines = [
    "# Eric's Recommended Albums",
    '',
    // Same words as the page description, without the styling
    document.querySelector('.intro').textContent.replace(/\s+/g, ' ').trim(),
    '',
    `Source: ${location.origin}${location.pathname}${filtered ? ` (${list.length} of ${albums.length} albums shown)` : ''}`,
    '',
  ];
  for (const a of list) {
    lines.push(
      `- **${a.title}** — ${a.artist} (${a.year}). ${a.genres.join(', ')}. ` +
        `[Spotify](${a.links.spotify}) · [Apple Music](${a.links.appleMusic})`,
    );
    if (a.why) lines.push(`  ${a.why}`);
  }
  return lines.join('\n') + '\n';
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for browsers that block the async clipboard API
    const ta = el('textarea', { readonly: '', style: { position: 'fixed', opacity: '0' } });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

let copyReset;
copyEl.addEventListener('click', async () => {
  const list = visibleAlbums();
  await copyText(toMarkdown(list));
  copyEl.textContent = `Copied ${list.length} album${list.length === 1 ? '' : 's'}`;
  copyEl.classList.add('copied');
  clearTimeout(copyReset);
  copyReset = setTimeout(() => {
    copyEl.textContent = 'Copy as Markdown';
    copyEl.classList.remove('copied');
  }, 2000);
});

searchEl.addEventListener('input', () => {
  state.query = searchEl.value;
  render();
});

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
