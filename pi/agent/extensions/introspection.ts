import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const WIDGET_ID = "introspection";

function estimateTokensFromChars(text: string): number {
  return Math.ceil(text.length / 4);
}

export default function (pi: ExtensionAPI) {
  let initialActiveTools: Set<string> | null = null;

  function getInitialActiveTools(): Set<string> {
    if (!initialActiveTools) {
      initialActiveTools = new Set(pi.getActiveTools());
    }
    return initialActiveTools;
  }

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

  pi.registerCommand("tools", {
    description: "Show active tools in a temporary widget",
    handler: async (_args, ctx) => {
      const activeNames = new Set(pi.getActiveTools());
      const activeTools = pi.getAllTools().filter((tool) => activeNames.has(tool.name));

      const dim = "\u001b[2m";
      const cyan = "\u001b[36m";
      const green = "\u001b[32m";
      const reset = "\u001b[0m";

      const lines = [
        `${cyan}Active tools${reset} ${dim}(${activeTools.length})${reset}`,
        "",
        ...activeTools.map((tool) => `${green}•${reset} ${cyan}\`${tool.name}\`${reset}${tool.description ? ` ${dim}— ${tool.description}${reset}` : ""}`),
      ];

      ctx.ui.setWidget(WIDGET_ID, lines);
      ctx.ui.notify("Active tools shown (clears on next input)", "info");
    },
  });

  pi.registerCommand("tool-on", {
    description: "Enable a tool by name",
    handler: async (args, ctx) => {
      const name = (args ?? "").trim();
      if (!name) {
        ctx.ui.notify("Usage: /tool-on <tool-name>", "warning");
        return;
      }

      const allNames = new Set(pi.getAllTools().map((t) => t.name));
      if (!allNames.has(name)) {
        ctx.ui.notify(`Unknown tool: ${name}`, "error");
        return;
      }

      const active = new Set(pi.getActiveTools());
      active.add(name);
      pi.setActiveTools([...active]);
      ctx.ui.notify(`Enabled tool: ${name}`, "success");
    },
  });

  pi.registerCommand("tool-off", {
    description: "Disable a tool by name",
    handler: async (args, ctx) => {
      const name = (args ?? "").trim();
      if (!name) {
        ctx.ui.notify("Usage: /tool-off <tool-name>", "warning");
        return;
      }

      const active = new Set(pi.getActiveTools());
      if (!active.has(name)) {
        ctx.ui.notify(`Tool is not active: ${name}`, "warning");
        return;
      }

      active.delete(name);
      pi.setActiveTools([...active]);
      ctx.ui.notify(`Disabled tool: ${name}`, "success");
    },
  });

  pi.registerCommand("tools-reset", {
    description: "Reset tools to the initially active set",
    handler: async (_args, ctx) => {
      const names = [...getInitialActiveTools()].filter((name) =>
        pi.getAllTools().some((t) => t.name === name),
      );
      pi.setActiveTools(names);
      ctx.ui.notify(`Reset tools: restored ${names.length} tools`, "success");
    },
  });

  pi.on("input", (_event, ctx) => {
    ctx.ui.setWidget(WIDGET_ID, undefined);
  });

  pi.on("session_shutdown", (_event, ctx) => {
    ctx.ui.setWidget(WIDGET_ID, undefined);
  });
}
