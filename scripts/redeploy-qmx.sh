#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://fit-pulse-qmxvo1924-tilios-projects-934474fe.vercel.app"
ALIAS="fit-pulse-sandy.vercel.app"

NEW_URL=$(vercel redeploy "$BASE_URL" --target production)
echo "Redeployed from base: $BASE_URL"
echo "New deployment: $NEW_URL"

vercel alias set "$NEW_URL" "$ALIAS" >/dev/null

echo "Alias updated: https://$ALIAS -> $NEW_URL"
