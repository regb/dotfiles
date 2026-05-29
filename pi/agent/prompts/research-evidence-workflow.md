---
description: Run a research workflow that gathers broad evidence and produces a report package with reusable artifacts
argument-hint: "<research-task>"
---

# Purpose

Execute a research workflow that produces both:

1. a strong final written report, and
2. a reusable evidence package in `REPORT_DIR` for handoff to other agents.

## Research Task

$@

## Instructions

- Treat `REPORT_DIR` as the root output folder for this task
- Create and maintain these paths:
  - `REPORT_DIR/README.md` for the final report and pointers
  - `REPORT_DIR/evidence/`
  - `REPORT_DIR/notes/`
  - `REPORT_DIR/index.csv`
- Save evidence continuously while researching, not only at the end.
- Prefer raw/source artifacts whenever available: JSON, YAML, CSV, PDF, images, OpenAPI specs, schema files, docs exports.
- For claims in the final report, keep at least one corresponding artifact in `evidence/`.
- If direct download is not possible, record in `notes/`:
  - source URL
  - extraction method
  - timestamp (UTC)
  - key excerpt

## Workflow

1. Generate a fresh REPORT_DIR with the format research/YYYYMMDD-topic/. Make sure that folder is new under research/.
2. Go wide first: collect diverse sources and alternatives.
3. Go deep second: validate key findings with primary sources.
4. Save artifacts into `evidence/` as you discover them.
5. Write intermediate reasoning and extracted snippets into `notes/`.
6. Maintain `index.csv` with this header:

`id,title,topic,source_url,local_path,format,collected_at_utc,relevance,confidence`

## Report

Before finishing, ensure all of the following are true:

- `evidence/` contains substantive raw artifacts (not only summary markdown).
- `index.csv` references all key artifacts and includes source URLs.
- `README.md` cites source URLs and points to relevant local evidence files.
- Output is organized so another agent can continue using only `REPORT_DIR`.
