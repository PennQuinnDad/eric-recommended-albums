#!/usr/bin/env node
// Helper for the /new-album skill. Plain Node, no dependencies.
//
//   node album-tools.mjs find <artist> <title>      Apple Music + Discogs candidates for an album
//   node album-tools.mjs spotify <albumId...>       Check Spotify album pages (artist, tracks, playable)
//   node album-tools.mjs add <file.json> [--dry-run]   Validate and add an album to albums.json and albums.md
//
// Set ALBUMS_ROOT to point at a different copy of the project (used for testing).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const UA = 'EricRecommendedAlbums/1.0 (eric@quinnpenn.com)';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = process.env.ALBUMS_ROOT || path.resolve(here, '../../..');
const dataPath = path.join(root, 'dev/src/albums.json');
const docPath = path.join(root, 'project/docs/albums.md');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ')
    .replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/^the /, '').trim();
const loadAlbums = () => JSON.parse(readFileSync(dataPath, 'utf8'));

// Same patterns the site's build check uses (dev/vite.config.js)
const LINK_PATTERNS = {
  spotify: /^https:\/\/open\.spotify\.com\/album\/\w+$/,
  appleMusic: /^https:\/\/music\.apple\.com\/[a-z]{2}\/album\/[^/]+\/\d+$/,
  discogs: /^https:\/\/www\.discogs\.com\/master\/\d+(-[^/]*)?$/,
};

async function getJson(url, { discogs = false } = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (discogs) await sleep(2600); // Discogs allows 25 requests a minute without a login
    if (r.status === 429) { await sleep(20000); continue; }
    return r.ok ? r.json() : null;
  }
  return null;
}

// ---------------------------------------------------------------- find

const EXTRA_EDITION = /deluxe|expanded|anniversary|legacy|super|remix|live|demos?|sessions|bonus|collector|edition|mono version|b-sides|rarities/i;

async function findApple(artist, title) {
  const wanted = norm(title).split(' ').filter(Boolean);
  const a = await getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=musicArtist&country=us&limit=5`);
  const match = a?.results?.find((x) => norm(x.artistName) === norm(artist)) || a?.results?.[0];
  let albums = [];
  if (match) {
    const l = await getJson(`https://itunes.apple.com/lookup?id=${match.artistId}&entity=album&limit=200&country=us`);
    albums = (l?.results || []).slice(1);
  }
  let hits = albums.filter((x) => wanted.every((w) => norm(x.collectionName).includes(w)));
  if (!hits.length) {
    const s = await getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(artist + ' ' + title)}&entity=album&country=us&limit=10`);
    hits = (s?.results || []).filter((x) => wanted.every((w) => norm(x.collectionName).includes(w)));
  }
  console.log(`\n== Apple Music (artist: ${match?.artistName ?? 'not found'})`);
  if (!hits.length) console.log('  no match. Try different wording, or search by hand.');
  for (const x of hits.sort((p, q) => (EXTRA_EDITION.test(p.collectionName) ? 1 : 0) - (EXTRA_EDITION.test(q.collectionName) ? 1 : 0) || p.trackCount - q.trackCount)) {
    const flag = EXTRA_EDITION.test(x.collectionName) ? '   (extra edition, probably not this one)' : '';
    console.log(`  ${x.releaseDate.slice(0, 10)} | ${x.collectionName} | ${x.trackCount} tracks | ${x.collectionViewUrl.split('?')[0]}${flag}`);
  }
}

async function findDiscogs(artist, title) {
  const want = norm(`${artist} ${title}`);
  const search = async (params) => {
    const q = new URLSearchParams({ type: 'master', per_page: '25', ...params });
    return (await getJson(`https://api.discogs.com/database/search?${q}`, { discogs: true }))?.results || [];
  };
  let results = await search({ artist, release_title: title });
  let hits = results.filter((r) => norm(r.title.replace(' - ', ' ')) === want);
  if (!hits.length) {
    results = await search({ q: `${artist} ${title}` });
    hits = results.filter((r) => norm(r.title.replace(' - ', ' ')) === want);
  }
  if (!hits.length) hits = results.filter((r) => norm(r.title).includes(norm(title))).slice(0, 4);
  console.log('\n== Discogs masters (the canonical page for one album, covering every pressing)');
  if (!hits.length) { console.log('  no match. Try different wording.'); return; }
  const detailed = [];
  for (const h of hits.slice(0, 4)) {
    const id = h.master_id || h.id;
    const m = await getJson(`https://api.discogs.com/masters/${id}`, { discogs: true });
    const v = await getJson(`https://api.discogs.com/masters/${id}/versions?per_page=1`, { discogs: true });
    if (m) detailed.push({ id, m, pressings: v?.pagination?.items ?? 0 });
  }
  // The real album page has far more pressings than a promo, test pressing or single
  for (const d of detailed.sort((p, q) => q.pressings - p.pressings)) {
    console.log(`  ${d.id} | ${d.m.title} | ${d.m.artists.map((x) => x.name).join(', ')} | ${d.m.year} | ${d.m.tracklist.length} tracks | ${d.pressings} pressings`);
    console.log(`      genres: ${(d.m.genres || []).join(', ')} | styles: ${(d.m.styles || []).join(', ')}`);
    console.log(`      ${d.m.uri}`);
  }
  console.log('  Pick the one with by far the most pressings whose track count matches the standard album.');
}

async function find(artist, title) {
  if (!artist || !title) fail('usage: find <artist> <title>');
  const albums = loadAlbums();
  const dup = albums.find((a) => norm(a.title) === norm(title) && norm(a.artist) === norm(artist));
  if (dup) console.log(`!! ALREADY LISTED: "${dup.title}" by ${dup.artist} (${dup.year}). Don't add it again.`);
  await findApple(artist, title);
  await findDiscogs(artist, title);
  const counts = {};
  for (const a of albums) for (const g of a.genres) counts[g] = (counts[g] || 0) + 1;
  console.log('\n== Genres already on the site (reuse these where they fit)');
  console.log('  ' + Object.entries(counts).sort((x, y) => y[1] - x[1]).map(([g, n]) => `${g} (${n})`).join(', '));
  console.log('\nNext: find the Spotify album page with a web search, then run: spotify <albumId>');
}

// ---------------------------------------------------------------- spotify

async function spotify(ids) {
  if (!ids.length) fail('usage: spotify <albumId...>');
  for (const id of ids) {
    const page = await (await fetch(`https://open.spotify.com/embed/album/${id}`, { headers: { 'Accept-Language': 'en-US' } })).text().catch(() => '');
    const m = page.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    const ent = m ? JSON.parse(m[1])?.props?.pageProps?.state?.data?.entity : null;
    if (!ent) { console.log(`${id} | NOT FOUND`); continue; }
    const playable = ent.trackList.filter((t) => t.isPlayable !== false).length;
    const o = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent('https://open.spotify.com/album/' + id)}`);
    const flag = playable < ent.trackList.length ? '   <-- not fully playable in the US, pick another listing' : '';
    console.log(`${id} | ${ent.name} | ${ent.subtitle} | ${ent.trackList.length} tracks | playable ${playable}/${ent.trackList.length} | oembed ${o.status}${flag}`);
  }
}

// ---------------------------------------------------------------- add

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => { const [p, q] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (p + 0.05) / (q + 0.05); };

async function validate(entry, albums) {
  const problems = [];
  if (!entry.title?.trim() || !entry.artist?.trim()) problems.push('title and artist are required');
  if (!Number.isInteger(entry.year) || entry.year < 1900 || entry.year > 2100) problems.push('year must be a whole number');
  if (!Array.isArray(entry.genres) || !entry.genres.length || entry.genres.length > 4 || entry.genres.some((g) => !g?.trim())) problems.push('genres: 1 to 4 non-empty names');
  if (!Array.isArray(entry.colors) || entry.colors.length !== 2 || !entry.colors.every((c) => /^#[0-9a-f]{6}$/i.test(c))) problems.push('colors: two hex colors like "#c8102e"');
  else if (contrast(...entry.colors) < 3) problems.push(`colors: contrast ${contrast(...entry.colors).toFixed(2)}:1 is too low to read (need 3:1 or better)`);
  for (const [key, pattern] of Object.entries(LINK_PATTERNS)) {
    if (!pattern.test(entry.links?.[key] ?? '')) problems.push(`links.${key}: missing or not an album page`);
  }
  if (albums.some((a) => norm(a.title) === norm(entry.title) && norm(a.artist) === norm(entry.artist))) problems.push('this album is already on the list');
  if (problems.length) return problems;

  // The links must actually resolve
  const sp = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(entry.links.spotify)}`);
  if (!sp.ok) problems.push(`Spotify link returned ${sp.status}`);
  const am = await fetch(entry.links.appleMusic, { headers: { 'User-Agent': UA } });
  if (!am.ok) problems.push(`Apple Music link returned ${am.status}`);
  const id = entry.links.discogs.match(/master\/(\d+)/)[1];
  const dm = await getJson(`https://api.discogs.com/masters/${id}`, { discogs: true });
  if (!dm) problems.push('Discogs master not found');
  else if (norm(dm.artists.map((a) => a.name).join(' ')).split(' ')[0] !== norm(entry.artist).split(' ')[0] && !norm(dm.artists.map((a) => a.name).join(' ')).includes(norm(entry.artist).split(' ')[0])) {
    problems.push(`Discogs master is by "${dm.artists.map((a) => a.name).join(', ')}", not ${entry.artist}`);
  }
  return problems;
}

function updateDoc(text, entry) {
  const lines = text.split('\n');

  // 1. The numbered master list: add a row after the last numbered row
  let last = -1;
  let number = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\| (\d+) \|/);
    if (m) { last = i; number = Number(m[1]); }
    if (lines[i].startsWith('## Listening links')) break;
  }
  if (last < 0) throw new Error('could not find the numbered album table in albums.md');
  const mark = entry.genresConfirmed ? '' : ' †';
  lines.splice(last + 1, 0, `| ${number + 1} | ${entry.title} | ${entry.artist} | ${entry.year} | ${entry.genres.join(', ')}${mark} | ${(entry.copies || []).join('; ')} | ${entry.why || ''} |`);

  // 2. A one-time note explaining how these later albums were checked
  const note = 'Albums added with /new-album (the numbers after those) had their year checked against Apple Music and Discogs. Their genres are suggestions, marked † until Eric confirms them.';
  if (!lines.some((l) => l.includes('added with /new-album'))) {
    const at = lines.findIndex((l) => l.startsWith('Albums 13'));
    if (at >= 0) lines.splice(at + 1, 0, '', note);
  }

  // 3. The listening links table: add a row after the last row
  const head = lines.findIndex((l) => l.startsWith('| Album | Spotify | Apple Music | Discogs |'));
  if (head < 0) throw new Error('could not find the Listening links table in albums.md');
  let end = head + 2;
  while (end < lines.length && lines[end].startsWith('| ')) end++;
  const n = entry.linkNotes || {};
  lines.splice(end, 0, `| ${entry.title} | [Spotify](${entry.links.spotify})${n.spotify ? ` (${n.spotify})` : ''} | [Apple Music](${entry.links.appleMusic})${n.appleMusic ? ` (${n.appleMusic})` : ''} | [Discogs](${entry.links.discogs}) |`);
  return lines.join('\n');
}

async function add(file, dryRun) {
  if (!file) fail('usage: add <file.json> [--dry-run]');
  const input = JSON.parse(readFileSync(file, 'utf8'));
  const albums = loadAlbums();
  const problems = await validate(input, albums);
  if (problems.length) {
    console.log('Not added. Fix these first:');
    for (const p of problems) console.log('  - ' + p);
    process.exit(1);
  }
  const entry = {
    title: input.title.trim(), artist: input.artist.trim(), year: input.year, genres: input.genres.map((g) => g.trim()),
    copies: input.copies || [], why: input.why || '', colors: input.colors.map((c) => c.toLowerCase()),
    links: { spotify: input.links.spotify, appleMusic: input.links.appleMusic, discogs: input.links.discogs },
  };
  const newDoc = updateDoc(readFileSync(docPath, 'utf8'), { ...input, ...entry });
  console.log(JSON.stringify(entry, null, 2));
  if (dryRun) { console.log(`\nDry run: nothing written. It would be album number ${albums.length + 1}.`); return; }
  writeFileSync(dataPath, JSON.stringify([...albums, entry], null, 2) + '\n');
  writeFileSync(docPath, newDoc);
  console.log(`\nAdded "${entry.title}" by ${entry.artist} as album number ${albums.length + 1}, in albums.json and albums.md.`);
}

function fail(msg) { console.error(msg); process.exit(2); }

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'find') await find(args[0], args.slice(1).join(' '));
else if (cmd === 'spotify') await spotify(args);
else if (cmd === 'add') await add(args.find((a) => !a.startsWith('--')), args.includes('--dry-run'));
else fail('usage: album-tools.mjs find <artist> <title> | spotify <albumId...> | add <file.json> [--dry-run]');
