---
name: pdf-reader
description: "Surgical PDF extraction skill: extract page-range text, render pages to images, and extract embedded images without loading entire PDFs into context."
---

# PDF Reader Skill

Use this skill when the user asks to inspect or extract information from PDFs.

## Core rule

Read and follow `general-info.md` first. Never process an entire PDF unless the user explicitly asks for full-document extraction.

## Tools

All tools are exposed via a `uv` script (deps declared inline in the script):

```bash
uv run .pi/skills/pdf-reader/tools/pdf_surgery.py <command> [options]
```

### 1) Extract raw text from page/range

```bash
uv run .pi/skills/pdf-reader/tools/pdf_surgery.py extract-text \
  --pdf /path/to/file.pdf \
  --pages 3

uv run .pi/skills/pdf-reader/tools/pdf_surgery.py extract-text \
  --pdf /path/to/file.pdf \
  --pages 3-5
```

### 2) Render page to image

```bash
uv run .pi/skills/pdf-reader/tools/pdf_surgery.py render-page \
  --pdf /path/to/file.pdf \
  --page 7 \
  --out /tmp/page-7.png \
  --dpi 220
```

### 3) Extract embedded images from a page

```bash
uv run .pi/skills/pdf-reader/tools/pdf_surgery.py extract-images \
  --pdf /path/to/file.pdf \
  --page 7 \
  --out-dir /tmp/page-7-images
```

## Optional quick metadata

```bash
uv run .pi/skills/pdf-reader/tools/pdf_surgery.py info --pdf /path/to/file.pdf
```

## Notes

- Page numbers are 1-based.
- `--pages` accepts either `N` or `N-M`.
- Runtime: `uv` (the script declares `PyMuPDF` inline).
