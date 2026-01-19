---
description: Prime the agent with understanding of the current psql context and how to use the tool
---

# Purpose

Understand the current context of psql. DO NOT MODIFY any configuration or state.

## Instructions

- Use `psql` cli for any postgresql operations
- All the relevant `PG*` env variables are already defined. NEVER read or print `PGPASSWORD` anywhere, you should let `psql` use it.
- If you find out that `psql` cannot connect, let the user know and explain that they should configure the right `PG*` environment variables before proceeding.

## Workflow

1. Run this command: `psql -c "\l"`.
2. Run this command: `psql -c "\conninfo"`.
3. Run the `Report` section.

## Report

Report the current state of the database and how `psql` is configured.
In case `psql` is not properly configured (can't access the database or connection) make this very clear to the user and ask them to properly set up `psql` in the current terminal session.
DO NOT attempt to fix the config, just tell the user to do it.
