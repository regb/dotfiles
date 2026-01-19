---
description: Prime the agent with understanding of the current kubectl context and how to use the tool
---

# Purpose

Understand the current context of kubectl. DO NOT MODIFY any configuration or state of kubectl.

## Instructions

- Use `kubectl` cli for any kubernetes operations
- `kubectl` is already configured for proper cluster access, feel free to use it when I'm asking questions about kubernetes

## Workflow

1. Run this command: `kubectl config current-context && kubectl get nodes && kubectl get ns`
2. Run the `Report` section.

## Report

Report the current state of the cluster and how `kubectl` is configured.
In case `kubectl` is not properly configured (can't access the cluster) make this very clear to the user and ask them to properly set up `kubectl` in the current terminal session.
DO NOT attempt to fix the config, just tell the user to do it.
