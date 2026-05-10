---
name: tmux-background
description: Use this when you want to start a long-lived dev process like a web server in background and will want to interact with it for testing or validating the behaviour. This skill explain how to use tmux for starting backgroud jobs, observe and capture logs, and safe cleanup.
---

# tmux Background Process Skill

```bash
tmux kill-session -t <session> 2>/dev/null || true
tmux new-session -d -s <session> "bash -lc 'cd <repo> && <command-1>; exec bash'"
tmux new-window -t <session> -n <name-2> "bash -lc 'cd <repo> && <command-2>; exec bash'"
```

Use this when you need services to keep running while you test in parallel.

## When to use

- Start multi-service local stacks
- Keep servers running while using browser/UAT tooling
- Capture logs from parallel processes
- Restart and clean up repeatably

## Standard workflow

1. Kill stale session (idempotent).
2. Start tmux session detached.
3. Add one window per service.
4. Wait/poll for service readiness.
5. Run tests/UAT.
6. Collect logs and evidence.
7. Kill session.

## Logs and debugging

List windows:
```bash
tmux list-windows -t <session>
```

Capture recent logs from a specific window:
```bash
tmux capture-pane -pt <session>:<window> | tail -n 120
```

Attach interactively:
```bash
tmux attach -t <session>
```
Detach with `Ctrl-b d`.

## Cleanup

```bash
tmux kill-session -t <session> 2>/dev/null || true
```

## Best-practice notes

- Keep `exec bash` so crash logs remain visible.
- Use unique session names per stack.
- Never leave orphan tmux sessions after test runs.
