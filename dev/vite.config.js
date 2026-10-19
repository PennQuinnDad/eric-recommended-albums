import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// Every album must link to Spotify, Apple Music and Discogs (its master release page).
// Fail the build (and so the Amplify deploy) if any album is missing a link or has one
// that isn't an album page.
function requireListeningLinks() {
  return {
    name: 'require-listening-links',
    buildStart() {
      const albums = JSON.parse(readFileSync(new URL('./src/albums.json', import.meta.url), 'utf8'));
      const problems = [];
      for (const a of albums) {
        if (!/^https:\/\/open\.spotify\.com\/album\/\w+$/.test(a.links?.spotify ?? '')) {
          problems.push(`${a.title}: missing or invalid Spotify album link`);
        }
        if (!/^https:\/\/music\.apple\.com\/[a-z]{2}\/album\/[^/]+\/\d+$/.test(a.links?.appleMusic ?? '')) {
          problems.push(`${a.title}: missing or invalid Apple Music album link`);
        }
        if (!/^https:\/\/www\.discogs\.com\/master\/\d+(-[^/]*)?$/.test(a.links?.discogs ?? '')) {
          problems.push(`${a.title}: missing or invalid Discogs master link`);
        }
      }
      if (problems.length) this.error(`Album links check failed:\n  ${problems.join('\n  ')}`);
    },
  };
}

export default defineConfig({
  plugins: [requireListeningLinks()],
});
