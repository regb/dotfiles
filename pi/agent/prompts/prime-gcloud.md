---
description: Prime the agent with understanding of the current gcloud context and how to use the tool
---

# Purpose

Understand the current context of `gcloud`. DO NOT MODIFY any configuration, credentials, resources, or state of `gcloud` or Google Cloud.

## Instructions

- Use the `gcloud` CLI for any Google Cloud operations.
- `gcloud` may already be configured for proper Google Cloud access; feel free to use it when I'm asking questions about Google Cloud.
- Only run read-only commands while priming.
- If `gcloud` is not authenticated or cannot access Google Cloud, make this very clear and tell me to run `gcloud auth login` in the current terminal session.
- DO NOT attempt to fix authentication, switch accounts, change projects, or update config.

## Workflow

1. Run these commands:

```bash
gcloud config configurations list
gcloud config list
gcloud auth list
gcloud info --format='value(config.paths.active_config_path)'
gcloud projects list --format='table(projectId,name,projectNumber,lifecycleState)'
gcloud projects describe "$(gcloud config get-value project 2>/dev/null)" --format='yaml(projectId,name,projectNumber,lifecycleState)' 2>/dev/null || true
```

2. If the active project is set and accessible, optionally run additional read-only discovery commands relevant to the user's question.
3. Run the `Report` section.

## Report

Report the current state of `gcloud` and what it is connected to, including:

- Active configuration name/path.
- Active authenticated account, or that no active account is available.
- Current project, region, and zone if configured.
- Whether the configured project is accessible.
- Any obvious access/authentication errors encountered.

In case `gcloud` is not properly configured or authenticated, clearly state that Google Cloud access is not available and ask the user to run:

```bash
gcloud auth login
```

DO NOT attempt to fix the config or authentication; just tell the user to do it.
