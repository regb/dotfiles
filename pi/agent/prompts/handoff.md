---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: [next_task]
---

## Variables

NEXT_TASK: $@

## Instructions

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save it to a path produced by `mktemp -t handoff-XXXXXX.md` (read the file before you write to it).

Suggest the skills to be used, if any, by the next session.

Do not duplicate content already captured in other artifacts (PRDs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

If $NEXT_TASK is defined, treat it as the task for the next agent that will read that doc and tailor the doc accordingly.
