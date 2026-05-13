#!/bin/bash
# Usage: ./rename.sh "NewName" "newdomain.com"
# Replaces "Statoku" → NewName and "statoku.app" → newdomain.com across the project
# Run from the project root.

set -e

NEW_NAME="${1:-Statoku}"
NEW_DOMAIN="${2:-statoku.app}"

if [ "$NEW_NAME" = "Statoku" ] && [ "$NEW_DOMAIN" = "statoku.app" ]; then
  echo "Usage: $0 \"NewName\" \"newdomain.com\""
  echo "Example: $0 \"Statele\" \"statele.com\""
  exit 1
fi

echo "→ Renaming brand:  Statoku → $NEW_NAME"
echo "→ Renaming domain: statoku.app → $NEW_DOMAIN"
echo ""

# Files to update (extensions: html, js, json, css, xml, txt, md, svg)
FILES=$(find . -type f \( \
  -name "*.html" -o -name "*.js" -o -name "*.json" -o -name "*.css" \
  -o -name "*.xml" -o -name "*.txt" -o -name "*.md" -o -name "*.svg" \
  \) -not -path "./node_modules/*" -not -path "./.git/*")

# Lowercase version of names for storage keys (e.g. localStorage 'statoku_dev')
NEW_NAME_LOWER=$(echo "$NEW_NAME" | tr '[:upper:]' '[:lower:]')

for f in $FILES; do
  # Brand (case-sensitive in 3 forms)
  sed -i.bak \
    -e "s/Statoku/$NEW_NAME/g" \
    -e "s/statoku\\.app/$NEW_DOMAIN/g" \
    -e "s/statoku_/${NEW_NAME_LOWER}_/g" \
    "$f"
  rm -f "${f}.bak"
done

echo "✓ Done. Verify with:"
echo "  grep -ri 'statoku' . | grep -v node_modules | grep -v .git"
