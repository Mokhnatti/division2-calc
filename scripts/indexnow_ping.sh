#!/bin/bash
# IndexNow ping — tell Bing/Yandex about updated URLs instantly
# Usage: ./indexnow_ping.sh [url1 url2 ...]  OR  ./indexnow_ping.sh --sitemap
#
# API docs: https://www.indexnow.org/documentation

KEY="300dc7cc2fb14cd6671f7e103f9e4df4ee58e402854c4c6380146a2da5c5b85f"
HOST="divcalc.xyz"
KEY_LOCATION="https://divcalc.xyz/${KEY}.txt"

if [ "$1" = "--sitemap" ]; then
  # Hard-coded key list from sitemap.xml — main sections + 432 item pages
  SITEMAP_URL="https://divcalc.xyz/sitemap.xml"
  URLS=$(curl -s "$SITEMAP_URL" | grep -oE '<loc>[^<]+</loc>' | sed 's/<\/\?loc>//g')
elif [ $# -gt 0 ]; then
  URLS="$@"
else
  # Default: just main routes
  URLS="https://divcalc.xyz/
https://divcalc.xyz/build
https://divcalc.xyz/dps
https://divcalc.xyz/sets
https://divcalc.xyz/exotics
https://divcalc.xyz/named-items
https://divcalc.xyz/skills
https://divcalc.xyz/tank
https://divcalc.xyz/help"
fi

# Build JSON payload
URL_LIST=$(echo "$URLS" | grep -v '^$' | awk '{printf "%s\"%s\"", (NR>1?",":""), $0}')

PAYLOAD=$(cat <<EOF
{
  "host": "${HOST}",
  "key": "${KEY}",
  "keyLocation": "${KEY_LOCATION}",
  "urlList": [${URL_LIST}]
}
EOF
)

# Ping all IndexNow endpoints (they share key infrastructure; one is enough, but try both)
for ENDPOINT in "https://api.indexnow.org/indexnow" "https://www.bing.com/indexnow" "https://yandex.com/indexnow"; do
  echo "→ $ENDPOINT"
  curl -s -X POST "$ENDPOINT" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "$PAYLOAD" \
    -w "HTTP %{http_code}\n"
done
