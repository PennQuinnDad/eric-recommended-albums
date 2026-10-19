#!/usr/bin/env bash
# Helpers for the /publish skill: fingerprint the live site, and wait for it to change.
#
#   live-check.sh snapshot          print a fingerprint of what the live site serves now
#   live-check.sh wait <before>     poll until the fingerprint differs from <before>
#
# The fingerprint is a hash of the live page's HTML. Vite puts a content hash in every
# script and stylesheet filename, so any change to the site's code, styles, data or
# page text changes the HTML, and a deploy that changes nothing visible does not.
set -uo pipefail

LIVE_URL="https://main.d14l4xii94mt7b.amplifyapp.com/"
# 30 polls x 20 seconds = 10 minutes. The environment variables exist so tests can shorten it.
POLLS="${PUBLISH_POLLS:-30}"
INTERVAL="${PUBLISH_INTERVAL:-20}"

html() { curl -fsS --max-time 15 "$LIVE_URL"; }
fingerprint() { html | shasum | cut -d' ' -f1; }

case "${1:-}" in
  snapshot)
    fingerprint || { echo "could not reach $LIVE_URL" >&2; exit 1; }
    ;;
  wait)
    before="${2:?usage: live-check.sh wait <fingerprint from snapshot>}"
    SECONDS=0
    for _ in $(seq 1 "$POLLS"); do
      now="$(fingerprint 2>/dev/null || true)"
      if [[ -n "$now" && "$now" != "$before" ]]; then
        # Sanity check: how many albums does the live bundle actually carry?
        js="$(html | grep -oE '/assets/[^"]+\.js' | head -1)"
        albums="$(curl -fsS --max-time 15 "${LIVE_URL%/}$js" | grep -o 'open\.spotify\.com/album/[A-Za-z0-9]*' | sort -u | wc -l | tr -d ' ')"
        echo "LIVE after ~${SECONDS}s: new build is up, carrying ${albums} albums with Spotify links"
        exit 0
      fi
      sleep "$INTERVAL"
    done
    echo "NOT LIVE after ${SECONDS}s: the site is still serving the old build"
    exit 1
    ;;
  *)
    echo "usage: live-check.sh snapshot | wait <fingerprint>" >&2
    exit 2
    ;;
esac
