#!/usr/bin/env -S uv run --script
# /// script
# dependencies = [
#   "pymupdf>=1.24.0",
# ]
# ///
"""Surgical PDF utilities for Pi skill usage."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Tuple


def get_fitz() -> Any:
    try:
        import fitz  # type: ignore

        return fitz
    except Exception:
        raise RuntimeError("PyMuPDF is required. Install with: pip install pymupdf")


def parse_page_range(value: str) -> Tuple[int, int]:
    value = value.strip()
    if "-" in value:
        left, right = value.split("-", 1)
        start = int(left)
        end = int(right)
    else:
        start = int(value)
        end = start

    if start < 1 or end < 1:
        raise ValueError("Page numbers must be >= 1")
    if end < start:
        raise ValueError("Range end must be >= start")
    return start, end


def ensure_page_in_bounds(doc: Any, page_num_1_based: int) -> None:
    if page_num_1_based < 1 or page_num_1_based > doc.page_count:
        raise ValueError(
            f"Page {page_num_1_based} out of bounds. PDF has {doc.page_count} pages."
        )


def cmd_info(args: argparse.Namespace) -> int:
    fitz = get_fitz()
    with fitz.open(args.pdf) as doc:
        payload = {
            "path": str(Path(args.pdf).resolve()),
            "pages": doc.page_count,
            "metadata": doc.metadata or {},
        }
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


def cmd_extract_text(args: argparse.Namespace) -> int:
    fitz = get_fitz()
    start, end = parse_page_range(args.pages)
    with fitz.open(args.pdf) as doc:
        ensure_page_in_bounds(doc, start)
        ensure_page_in_bounds(doc, end)

        for page_num in range(start, end + 1):
            page = doc.load_page(page_num - 1)
            text = page.get_text("text")
            print(f"===== PAGE {page_num} =====")
            print(text.rstrip())
            if page_num != end:
                print()
    return 0


def cmd_render_page(args: argparse.Namespace) -> int:
    fitz = get_fitz()
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    zoom = args.dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)

    with fitz.open(args.pdf) as doc:
        ensure_page_in_bounds(doc, args.page)
        page = doc.load_page(args.page - 1)
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        pix.save(str(out_path))

    print(str(out_path.resolve()))
    return 0


def cmd_extract_images(args: argparse.Namespace) -> int:
    fitz = get_fitz()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    extracted = []

    with fitz.open(args.pdf) as doc:
        ensure_page_in_bounds(doc, args.page)
        page = doc.load_page(args.page - 1)
        images = page.get_images(full=True)

        for idx, img in enumerate(images, start=1):
            xref = img[0]
            base = doc.extract_image(xref)
            ext = base.get("ext", "bin")
            data = base["image"]

            out_file = out_dir / f"page-{args.page:04d}-img-{idx:03d}.{ext}"
            with open(out_file, "wb") as f:
                f.write(data)

            extracted.append(
                {
                    "index": idx,
                    "xref": xref,
                    "width": base.get("width"),
                    "height": base.get("height"),
                    "colorspace": base.get("colorspace"),
                    "ext": ext,
                    "path": str(out_file.resolve()),
                }
            )

    print(json.dumps({"page": args.page, "count": len(extracted), "images": extracted}, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Surgical PDF tools")
    sub = parser.add_subparsers(dest="command", required=True)

    p_info = sub.add_parser("info", help="Show lightweight PDF metadata")
    p_info.add_argument("--pdf", required=True, help="Path to PDF")
    p_info.set_defaults(func=cmd_info)

    p_text = sub.add_parser("extract-text", help="Extract text from one page or range")
    p_text.add_argument("--pdf", required=True, help="Path to PDF")
    p_text.add_argument("--pages", required=True, help="Page N or range N-M (1-based)")
    p_text.set_defaults(func=cmd_extract_text)

    p_render = sub.add_parser("render-page", help="Render one page to image")
    p_render.add_argument("--pdf", required=True, help="Path to PDF")
    p_render.add_argument("--page", required=True, type=int, help="1-based page number")
    p_render.add_argument("--out", required=True, help="Output image path (e.g. .png)")
    p_render.add_argument("--dpi", type=int, default=220, help="Render DPI (default: 220)")
    p_render.set_defaults(func=cmd_render_page)

    p_img = sub.add_parser("extract-images", help="Extract embedded images from one page")
    p_img.add_argument("--pdf", required=True, help="Path to PDF")
    p_img.add_argument("--page", required=True, type=int, help="1-based page number")
    p_img.add_argument("--out-dir", required=True, help="Output directory")
    p_img.set_defaults(func=cmd_extract_images)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if not os.path.exists(args.pdf):
        print(f"ERROR: PDF not found: {args.pdf}", file=sys.stderr)
        return 2

    try:
        return args.func(args)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
