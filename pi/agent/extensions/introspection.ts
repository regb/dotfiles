import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { wrapTextWithAnsi } from "@mariozechner/pi-tui";
import { applySystemPromptTransforms, getSystemPromptTransformNames } from "./system-prompt-transform";

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
      const basePrompt = ctx.getSystemPrompt();
      const prompt = applySystemPromptTransforms(basePrompt);
      const chars = prompt.length;
      const tokens = estimateTokensFromChars(prompt);
      const transforms = getSystemPromptTransformNames();

      ctx.ui.setWidget(WIDGET_ID, [
        `System prompt metadata: chars=${chars}, est_tokens=${tokens}, transforms=${transforms.length ? transforms.join(",") : "none"}`,
        "",
        prompt,
      ]);
      ctx.ui.notify("System prompt shown (clears on next input)", "info");
    },
  });

  pi.registerCommand("tools", {
    description: "Show active and inactive tools in a temporary widget",
    handler: async (_args, ctx) => {
      const activeNames = new Set(pi.getActiveTools());
      const allTools = pi.getAllTools();
      const activeTools = allTools.filter((tool) => activeNames.has(tool.name));
      const inactiveTools = allTools.filter((tool) => !activeNames.has(tool.name));

      ctx.ui.setWidget(WIDGET_ID, (_tui, theme) => {
        const lines = [
          `${theme.fg("accent", "Active tools")} ${theme.fg("dim", `(${activeTools.length})`)}`,
          "",
          ...activeTools.map((tool) => `${theme.fg("success", "•")} ${theme.fg("accent", `\`${tool.name}\``)}${tool.description ? ` ${theme.fg("dim", `— ${tool.description}`)}` : ""}`),
          "",
          `${theme.fg("muted", "Inactive tools")} ${theme.fg("muted", `(${inactiveTools.length})`)}`,
          "",
          ...inactiveTools.map((tool) => `${theme.fg("muted", `• \`${tool.name}\`${tool.description ? ` — ${tool.description}` : ""}`)}`),
        ];

        return {
          render: (width: number) => {
            const safeWidth = Math.max(1, width);
            return lines.flatMap((line) => (line ? wrapTextWithAnsi(line, safeWidth) : [""]));
          },
          invalidate: () => {},
        };
      });
      ctx.ui.notify("Tools shown (clears on next input)", "info");
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
