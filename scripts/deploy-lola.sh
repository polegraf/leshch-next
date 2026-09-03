#!/usr/bin/env bash
# Перезаливка лендинга Lola из экспорта Claude Design.
# Использование:  ./scripts/deploy-lola.sh [путь/к/архиву.zip]
# Без аргумента берёт самый свежий .zip из ~/Downloads и lola_site/.
set -euo pipefail
cd "$(dirname "$0")/.."

SLUG=lola
ZIP="${1:-}"
if [ -z "$ZIP" ]; then
  ZIP=$(ls -t ~/Downloads/*.zip lola_site/*.zip 2>/dev/null | head -1 || true)
fi
[ -f "$ZIP" ] || { echo "Архив не найден. Укажи путь: $0 file.zip"; exit 1; }
echo "→ Архив: $ZIP"

TMP=$(mktemp -d)
unzip -oq "$ZIP" -d "$TMP"
SRC=$(dirname "$(find "$TMP" -name index.html | head -1)")
[ -f "$SRC/index.html" ] || { echo "В архиве нет index.html"; exit 1; }

# Полная замена содержимого public/lola (старые картинки не копятся)
rm -rf "public/$SLUG"
mkdir -p "public/$SLUG"
cp -R "$SRC"/. "public/$SLUG/"

# Относительные пути → абсолютные /lola/... (иначе ломаются на /lola без слэша)
sed -i '' \
  -e "s#src=\"\./support\.js\"#src=\"/$SLUG/support.js\"#" \
  -e "s#\"img/#\"/$SLUG/img/#g" \
  -e "s#'img/#'/$SLUG/img/#g" \
  "public/$SLUG/index.html"

# Копия архива в lola_site/ как история экспортов
mkdir -p lola_site && cp -n "$ZIP" "lola_site/$(date +%Y-%m-%d_%H%M)_$(basename "$ZIP")" 2>/dev/null || true

du -sh "public/$SLUG" | awk '{print "→ Размер: "$1}'
git add "public/$SLUG"
git commit -q -m "Lola: update from Claude Design export $(date +%Y-%m-%d\ %H:%M)" || { echo "Изменений нет"; exit 0; }
git push origin main
echo "✓ Запушено. Vercel соберёт за 1–2 мин → https://leshch.com/$SLUG (обнови с ⌘⇧R)"
rm -rf "$TMP"
