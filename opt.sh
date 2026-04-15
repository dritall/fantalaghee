#!/bin/bash
set -e

# Find all png, jpg, jpeg files
find public/image -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) > /tmp/to_convert.txt

count=$(wc -l < /tmp/to_convert.txt)
echo "Found $count images to convert."

while read -r file; do
    dir=$(dirname "$file")
    filename=$(basename "$file")
    ext="${filename##*.}"
    base="${filename%.*}"
    target="$dir/$base.webp"
    
    echo "Converting $file -> $target"
    npx -y sharp-cli -i "$file" -o "$target"
    if [ -f "$target" ]; then
        rm "$file"
    fi
done < /tmp/to_convert.txt

echo "Replacing extensions in code..."

# Find all code files and replace extensions
find app components public/articoli/md styles styles.css style.css tailwind.config.ts -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" -o -name "*.md" \) 2>/dev/null > /tmp/code_files.txt

while read -r file; do
    sed -i -E 's/\.(png|jpg|jpeg)/.webp/gI' "$file"
done < /tmp/code_files.txt

echo "Done!"
