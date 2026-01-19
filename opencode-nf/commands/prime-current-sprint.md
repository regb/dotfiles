---
description: List current sprint issues
---

# Purpose

Lookup the current sprint for `COMPANY_NAME` and display assigned issues. Execute the `Workflow` and `Report` section.

## Variables

COMPANY_NAME: !`echo $COMPANY_NAME`
JIRA_BOARD_ID: !`echo $JIRA_BOARD_ID`

## Instructions

- Use Jira and the `COMPANY_NAME` board (ID `JIRA_BOARD_ID`) to locate the current sprint.
- Display epics first, then tickets, clearly labeled.
- Use one row per issue with: number, title, status.
- Add color hints using emoji dots: epics 🟣, tickets 🔵.
- Add status color dots after the status: To Do 🟥, In Progress 🟡, Done 🟢.
- Include a couple of light emoticons to keep it friendly.

## Workflow

1. Use Jira to fetch the active sprint for the `COMPANY_NAME` board ID `JIRA_BOARD_ID`.
2. Query Jira for epics assigned to the current user that are not done.
3. Query Jira for issues in the active sprint and assigned to the current user.
4. Format results with epics first, then tickets, clearly labeled, one row per issue with number, title, and status. Use emoji dots for color hints (epics 🟣, tickets 🔵) and add status color dots after the status (To Do 🟥, In Progress 🟡, Done 🟢). Include a couple of light emoticons.

## Report

Report epics first and then sprint tickets, clearly labeled, one row per issue with number, title, and status. Use emoji dots for color hints (epics 🟣, tickets 🔵) and add status color dots after the status (To Do 🟥, In Progress 🟡, Done 🟢). Include a couple of light emoticons. Do not report anything else unless something went wrong and you need assistance.
