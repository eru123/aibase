---
name: Download Avatars
description: Download free avatars from DiceBear
---

# Download Avatars

This skill downloads random avatar images from [DiceBear](https://dicebear.com) (Avataaars style) and saves them to `uploads/downloaded_avatars`.

## Usage

Run the `download_avatars.php` script:

```bash
php .antigravity/skills/download_avatars/download_avatars.php --count=5
```

## Arguments

- `--count`: Number of avatars to download (default: 1, max: 20)
- `--gender`: Optional seed suffix (e.g. `male`, `female`) to influence randomness (depending on API collection)

## Output

Downloads PNG files to `uploads/downloaded_avatars/` and prints the paths.
