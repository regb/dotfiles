import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const WIDGET_ID = "system-prompt-viewer";

function estimateTokensFromChars(text: string): number {
  return Math.ceil(text.length / 4);
}

export default function (pi: ExtensionAPI) {
  pi.registerCommand("system-prompt", {
    description: "Show the current effective system prompt in a temporary widget",
    handler: async (_args, ctx) => {
      const prompt = ctx.getSystemPrompt();
      const chars = prompt.length;
      const tokens = estimateTokensFromChars(prompt);

      ctx.ui.setWidget(WIDGET_ID, [
        `System prompt metadata: chars=${chars}, est_tokens=${tokens}`,
        "",
        prompt,
      ]);
      ctx.ui.notify("System prompt shown (clears on next input)", "info");
    },
  });

  pi.on("input", (_event, ctx) => {
    ctx.ui.setWidget(WIDGET_ID, undefined);
  });

  pi.on("session_shutdown", (_event, ctx) => {
    ctx.ui.setWidget(WIDGET_ID, undefined);
  });
}
