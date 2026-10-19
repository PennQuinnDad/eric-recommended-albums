// True only on a Mac with a mouse or trackpad. An iPad in "desktop website" mode also reports
// itself as a Mac, but it has a touchscreen, and iPhones and iPads already open the Spotify
// and Music apps from ordinary links, so they don't need the "Open in app" setting.
export function isMacDesktop(nav = navigator) {
  const platform = nav.userAgentData?.platform || nav.platform || '';
  return /^mac/i.test(platform) && !(nav.maxTouchPoints > 1);
}
