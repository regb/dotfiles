# PDF Reader Strategy Guide (Surgical Mode)

## Non-negotiable workflow

1. **Never read the entire PDF by default.**
2. Start with targeted extraction on one page or a narrow page range.
3. Expand only when evidence suggests the answer is elsewhere.
4. Prefer image rendering + vision only for pages that need layout/visual understanding.

## Why

Full-document extraction bloats context windows, slows reasoning, and increases cost/noise. Surgical extraction keeps answers precise.

## Decision flow

1. Identify likely pages from user hint (section/page/chapter/table).
2. Run `extract-text` on a small range (1 page first, then ±2 pages if needed).
3. If text seems missing/mangled (scans, charts, forms), run `render-page` and inspect the image.
4. If user asks about figures/embedded assets, run `extract-images` for the exact page.
5. Repeat in narrow increments until answer is found.

## Guardrails

- Do not dump huge text blocks when a short excerpt answers the question.
- Keep extracted artifacts in `/tmp` or a task-specific folder.
- Clearly cite which pages were inspected.
