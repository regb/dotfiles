---
description: Write down a spec based on the current context
agent: build
---

# Purpose

Create a new detailed spec file in `PATH` to describe the implementation of `REQUEST`.

## Variables

REQUEST: $1
PATH: $2 or `specs/` if empty

## Instructions

- Consider the conversation context and in particular the recent feature being discussed.
- Focus on writing down a detailed implementation plan for the `REQUEST` given by the user.
- Make sure to take into account the previous discussion and all the past inputs from the user.

## Workflow

1. Reflect on the entire conversation
2. Think hard about the user `REQUEST` given that context
3. Write a detailed spec file with an implementation plan for that `REQUEST` in a file at `PATH`
4. Run the `Report` section.

## Report

Report simply that you wrote a spec in the file at `PATH`. Simply summarize the title and the length of the file.
