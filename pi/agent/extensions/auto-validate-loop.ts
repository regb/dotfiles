import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type LoopState = {
  active: boolean;
  validationCommand: string;
  attempts: number;
  maxAttempts: number;
  originalRequest?: string;
  lastExitCode?: number;
  lastStdout?: string;
  lastStderr?: string;
};

const STATE_TYPE = "auto-validate-loop-state";

export default function (pi: ExtensionAPI) {
  let state: LoopState | null = null;
  let running = false;

  const save = (ctx: any) => {
    if (!state) return;
    pi.appendEntry(STATE_TYPE, state);
    const status = state.active
      ? `🔁 validate loop: on (${state.attempts}/${state.maxAttempts})`
      : undefined;
    ctx.ui.setStatus("auto-validate-loop", status);
  };

  const load = (ctx: any) => {
    state = null;
    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type === "custom" && entry.customType === STATE_TYPE) {
        state = entry.data as LoopState;
      }
    }

    // Backward compatibility for older saved state shape.
    if (state && !(state as any).validationCommand) {
      state.validationCommand = "bazel test ...";
    }

    if (state?.active) save(ctx);
  };

  const getFirstUserMessageText = (ctx: any): string | undefined => {
    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type === "message" && entry.message?.role === "user") {
        const content = entry.message?.content;
        if (typeof content === "string") return content;
        if (Array.isArray(content)) {
          const text = content
            .filter((c: any) => c?.type === "text" && typeof c.text === "string")
            .map((c: any) => c.text)
            .join("\n");
          if (text.trim()) return text;
        }
      }
    }
    return undefined;
  };

  pi.on("session_start", async (_event, ctx) => {
    load(ctx);
  });

  pi.registerCommand("autovalidate:start", {
    description: "Start post-agent validation loop",
    handler: async (args, ctx) => {
      const raw = (args || "").trim();
      let maxAttempts = 50;
      const command = "bazel test ...";

      if (raw) {
        const m = raw.match(/^(\d+)(?:\s+(.+))?$/);
        if (m) {
          maxAttempts = Number(m[1]) || 50;
        }
      }
      state = {
        active: true,
        validationCommand: command,
        attempts: 0,
        maxAttempts,
        originalRequest: getFirstUserMessageText(ctx),
      };
      save(ctx);
      ctx.ui.notify(`Auto-validate loop started (max ${maxAttempts}) with: ${command}`, "success");
    },
  });

  pi.registerCommand("autovalidate:stop", {
    description: "Stop post-agent validation loop",
    handler: async (_args, ctx) => {
      if (!state) return;
      state.active = false;
      save(ctx);
      ctx.ui.notify("Auto-validate loop stopped", "info");
    },
  });

  pi.registerCommand("autovalidate:status", {
    description: "Show post-agent validation loop status",
    handler: async (_args, ctx) => {
      if (!state) {
        ctx.ui.notify("No state", "info");
        return;
      }
      pi.sendMessage({
        customType: "auto-validate-loop",
        display: true,
        content: [
          `active: ${state.active}`,
          `attempts: ${state.attempts}/${state.maxAttempts}`,
          `command: ${state.validationCommand}`,
          `lastExitCode: ${state.lastExitCode ?? "n/a"}`,
          state.lastStdout ? `stdout:\n${state.lastStdout.slice(0, 400)}` : "",
          state.lastStderr ? `stderr:\n${state.lastStderr.slice(0, 400)}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
      });
    },
  });

  pi.on("agent_end", async (_event, ctx) => {
    if (!state?.active || running) return;
    if (state.attempts >= state.maxAttempts) {
      state.active = false;
      save(ctx);
      ctx.ui.notify("Auto-validate max attempts reached; stopped", "error");
      return;
    }

    running = true;
    try {
      const result = await pi.exec("bash", ["-lc", state.validationCommand], { timeout: 120000 });
      state.attempts += 1;
      state.lastExitCode = result.code ?? -1;
      state.lastStdout = result.stdout ?? "";
      state.lastStderr = result.stderr ?? "";
      save(ctx);

      if (result.code === 0) {
        state.active = false;
        save(ctx);
        ctx.ui.notify("Validation passed; loop complete", "success");
        return;
      }

      const failureMsg = [
        "Validation failed. Continue implementing and fix issues before next validation run.",
        `VALIDATION COMMAND IS: ${state.validationCommand}`,
        "VALIDATION RULE: YOUR CHANGES MUST MAKE THIS COMMAND EXIT WITH CODE 0.",
        "VALIDATION SIGNAL: NON-ZERO EXIT CODE MEANS FAILURE; OUTPUT/ERROR SHOW WHAT FAILED.",
        "🚨 IMPORTANT: DO NOT MODIFY OR UPDATE THE VALIDATION SCRIPT UNDER ANY CIRCUMSTANCES. DO NOT TOUCH IT. 🚨",
        "🚨 IMPORTANT: DO NOT READ OR MODIFY .pi/scripts/validate.sh. IT IS NOT THE ACTIVE VALIDATOR. 🚨",
        state.originalRequest ? `Original request reminder:\n${state.originalRequest.slice(0, 1500)}` : "",
        `Exit code: ${result.code}`,
        result.stdout ? `stdout:\n${result.stdout.slice(0, 1200)}` : "",
        result.stderr ? `stderr:\n${result.stderr.slice(0, 1200)}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const usage = typeof ctx.getContextUsage === "function" ? ctx.getContextUsage() : undefined;
      const usedTokens = usage?.tokens ?? 0;
      const maxTokens = usage?.maxTokens ?? ctx.model?.maxTokens ?? 0;
      const shouldCompact = maxTokens > 0 ? usedTokens / maxTokens >= 0.25 : true;

      if (shouldCompact) {
        await ctx.compact({
          customInstructions:
            "Summarize all implementation attempts and validation failures. Keep only: original user request, current objective, key attempted fixes, failing checks, actionable next steps.",
          onComplete: () => {
            pi.sendMessage({
              customType: "auto-validate-loop",
              display: true,
              content: `Compaction complete (${usedTokens}/${maxTokens || "?"} tokens). Posting validation failure follow-up.`,
            });
            pi.sendUserMessage(failureMsg, { deliverAs: "steer" });
          },
        });
      } else {
        pi.sendMessage({
          customType: "auto-validate-loop",
          display: true,
          content: `Skipping compaction (${usedTokens}/${maxTokens} tokens, below 25%). Posting validation failure follow-up.`,
        });
        pi.sendUserMessage(failureMsg, { deliverAs: "steer" });
      }
    } finally {
      running = false;
    }
  });

  pi.on("session_shutdown", async () => {
    running = false;
  });
}
