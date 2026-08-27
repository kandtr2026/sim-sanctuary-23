#!/usr/bin/env bash
# Sinh ảnh bìa cho loạt bài /tin-tuc rồi nén sang public/blog/*.webp.
# Chạy 1 lần khi thêm bài mới; ảnh thô nằm trong generated-media/ (đã gitignore).
set -u

STYLE="cinematic editorial product photography, near-black background, deep crimson and warm gold palette, dramatic rim lighting, shallow depth of field, luxury Vietnamese aesthetic, high detail, ABSOLUTELY NO text, no letters, no numbers, no digits, no logo, no watermark, no signature"
GEN="C:/Users/kandt/.claude/skills/hhtech-media/gen.mjs"

gen_one() {
  local slug="$1"; shift
  local prompt="$1"; shift
  if [ -f "public/blog/${slug}.webp" ]; then
    echo "SKIP ${slug} (đã có)"
    return 0
  fi
  echo "=== GEN ${slug} ==="
  rm -rf "generated-media/${slug}"
  node "$GEN" image "${prompt}. ${STYLE}" --aspect 16:9 --resolution 2k --out "generated-media/${slug}" 2>&1 | tail -2
  local raw
  raw=$(ls generated-media/"${slug}"/*.jpg generated-media/"${slug}"/*.png 2>/dev/null | head -1)
  if [ -z "${raw}" ]; then
    echo "!!! LỖI: không có ảnh cho ${slug}"
    return 1
  fi
  node scripts/blog-images/optimize.mjs "${raw}" "${slug}"
}

while IFS='|' read -r slug prompt; do
  [ -z "${slug}" ] && continue
  case "${slug}" in \#*) continue ;; esac
  gen_one "${slug}" "${prompt}"
done < scripts/blog-images/prompts.txt

echo "=== XONG ==="
ls -la public/blog/
