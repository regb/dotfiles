---
description: Prime Slack context with channels + recent activity
---

# Purpose

Gather a quick Slack overview (public channels, ids, and recent activity) with minimal calls. Execute the `Workflow` and `Report` sections.

## Variables

SLACK_USER: !`echo $SLACK_USER`
JOB_TITLE: !`echo $JOB_TITLE`

## Prompt context

I am `SLACK_USER` on Slack, my title is `JOB_TITLE`.

## Workflow

1. Fetch all public channels once using `slack_channels_list` with `channel_types=public_channel` and a high limit.
2. Fetch recent activity using a single `slack_conversations_search_messages` call with `filter_date_after` set to yesterday and `filter_date_before` set to tomorrow (one day in the future) to ensure coverage; then manually filter results to the last 24 hours by timestamp. Do NOT scan each channel individually.
3. Avoid any additional Slack calls unless the search fails; if it fails, report the error and stop.

## Report

Make the report more visual with markdown headers and a few relevant emojis. Return a concise list of public channels with their ids, followed by a short summary of the most recent messages found in the last day (message count, channel names, and a brief one-line highlight per channel if available). Make the following items very visible and explicitly call them out in the report if present, with extra detail (who, what, and why it matters):

- Messages mentioning `SLACK_USER`
- Messages related to Kubernetes, Bazel, general infrastructure, CI/CD, or monitoring

Add a final section that lists potentially concrete actions needed by `SLACK_USER` based on the messages, if any.
