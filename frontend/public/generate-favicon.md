# Favicon Generation Guide

## Quick Setup

1. **Use Online Generator**: Visit [favicon.io](https://favicon.io/) or [realfavicongenerator.net](https://realfavicongenerator.net/)
2. **Upload**: Use the `favicon.svg` file as source
3. **Download**: Get the complete favicon package
4. **Replace**: Update files in `/public` directory

## Command Line (ImageMagick)

```bash
# Convert SVG to PNG
magick favicon.svg -resize 16x16 favicon-16x16.png
magick favicon.svg -resize 32x32 favicon-32x32.png

# Create ICO file
magick favicon-16x16.png favicon-32x32.png favicon.ico
```

## Required Files

- `favicon.ico` - Main favicon (16x16, 32x32, 48x48)
- `favicon.svg` - Source vector file
- `favicon-16x16.png` - 16x16 PNG
- `favicon-32x32.png` - 32x32 PNG
- `apple-touch-icon.png` - iOS icon (180x180)
- `android-chrome-192x192.png` - Android icon (192x192)
- `android-chrome-512x512.png` - Android icon (512x512)

## Design

- Blue gradient background (#2563eb)
- White chart bars and trending arrow
- Professional trading theme
- High contrast for small sizes