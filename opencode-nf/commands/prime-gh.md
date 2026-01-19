---
description: Prime GitHub context and mentions
---

# Purpose

Gather GitHub context, latest open PRs, and recent mentions for the authenticated user. Execute the `Workflow` and `Report` section.

## Workflow

1. Run `gh auth status` to identify the authenticated GitHub user.
2. Run `gh pr list --limit 20` to list the latest open PRs.
3. Extract the username from the auth output and search for the 20 most recent mentions with `gh search issues "" --mentions <username> --include-prs --limit 20 --json number,title,state,url,updatedAt`.

## Report

Report the latest open PR, then call out 2-3 recent and important mention results. Keep the report concise and avoid listing every mention unless asked.
