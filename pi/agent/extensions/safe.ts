import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import os from "node:os";
import path from "node:path";

const ALLOW_DENY_CHOICES = ["Allow", "Deny", "Reject with feedback"] as const;
const STATIC_ALLOWED_READ_ROOTS = [path.join(os.homedir(), ".pi")];

type PermissionChoice = (typeof ALLOW_DENY_CHOICES)[number];

async function requestPermissionOrFeedback(
  ctx: any,
  prompt: string,
  deniedReasonPrefix: string,
): Promise<{ allow: true } | { allow: false; reason: string }> {
  const choice = (await ctx.ui.select(prompt, [...ALLOW_DENY_CHOICES])) as PermissionChoice | undefined;

  if (choice === "Allow") return { allow: true };

  if (choice === "Reject with feedback") {
    const feedback = (await ctx.ui.input("Reject with feedback:", "e.g. use a safer/smaller command"))?.trim();
    if (feedback) {
      return {
        allow: false,
        reason:
          `${deniedReasonPrefix}. Rejection context: \`${deniedReasonPrefix}\`. User feedback: \`${feedback}\`.\n` +
          "Assess the feedback and do one of the following: (1) answer the feedback directly if no tool is needed, or (2) immediately rerun an adapted tool call that satisfies the feedback, unless impossible or unsafe.",
      };
    }
    if (typeof ctx.abort === "function") ctx.abort();
    return { allow: false, reason: `${deniedReasonPrefix}: denied by user (no feedback provided)` };
  }

  if (typeof ctx.abort === "function") ctx.abort();
  return { allow: false, reason: `${deniedReasonPrefix}: denied by user` };
}

const isBlacklistedEnvPath = (filePath: string) => {
  const base = path.basename(filePath);
  return base === ".envrc" || base.endsWith(".env") || base.endsWith(".envrc");
};

const isInsideRoot = (root: string, filePath: string) => {
  const absRoot = path.resolve(root);
  const absPath = path.resolve(filePath);
  const rel = path.relative(absRoot, absPath);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
};

async function handleReadTool(event: { input: { path?: string } }, ctx: any) {
  const readPath = String(event.input.path ?? "");
  if (!readPath) return { block: true, reason: "Blocked read: missing path" };
  if (isBlacklistedEnvPath(readPath)) {
    return { block: true, reason: "Blocked read: environment files are blacklisted" };
  }

  const absReadPath = path.resolve(ctx.cwd, readPath);
  const allowedRoots = [ctx.cwd, ...STATIC_ALLOWED_READ_ROOTS];
  if (allowedRoots.some((root) => isInsideRoot(root, absReadPath))) return;

  if (!ctx.hasUI) {
    return { block: true, reason: "Blocked read outside allowlist: no UI available for approval" };
  }

  const decision = await requestPermissionOrFeedback(
    ctx,
    `Pi wants to read outside allowlist:\n${absReadPath}\n\nAllowed roots:\n- ${allowedRoots.join("\n- ")}`,
    "Blocked read outside allowlist",
  );
  if (!decision.allow) return { block: true, reason: decision.reason };
}

function handleGrepTool() {
  return;
}

function handleFindTool() {
  return;
}

function handleLsTool() {
  return;
}

async function handleEditTool(event: { input: { path?: string }; toolName: string }, ctx: any) {
  if (!ctx.hasUI) {
    return { block: true, reason: `Blocked ${event.toolName}: no UI available for approval` };
  }

  const target = String(event.input.path ?? "<unknown file>");
  const decision = await requestPermissionOrFeedback(
    ctx,
    `Pi wants to edit ${target}?`,
    `Blocked ${event.toolName}`,
  );
  if (!decision.allow) return { block: true, reason: decision.reason };
}

async function handleWriteTool(event: { input: { path?: string }; toolName: string }, ctx: any) {
  if (!ctx.hasUI) {
    return { block: true, reason: `Blocked ${event.toolName}: no UI available for approval` };
  }

  const target = String(event.input.path ?? "<unknown file>");
  const decision = await requestPermissionOrFeedback(
    ctx,
    `Pi wants to write ${target}?`,
    `Blocked ${event.toolName}`,
  );
  if (!decision.allow) return { block: true, reason: decision.reason };
}

async function handleBashTool(event: { toolName: string; input: unknown }, ctx: any) {
  if (!ctx.hasUI) {
    return { block: true, reason: `Blocked ${event.toolName}: no UI available for approval` };
  }

  const command = String((event.input as { command?: string }).command ?? "<unknown command>");
  const decision = await requestPermissionOrFeedback(
    ctx,
    `Pi wants to run:\n$ ${command}`,
    `Blocked ${event.toolName}`,
  );
  if (!decision.allow) return { block: true, reason: decision.reason };
}

export default function (pi: ExtensionAPI) {
  const isAgentbox = String(process.env.AGENTBOX ?? "").toLowerCase() === "true";
  let safeModeEnabled = !isAgentbox;

  pi.registerCommand("safe", {
    description: "Enable safe mode (approval gates)",
    handler: async (_args, ctx) => {
      safeModeEnabled = true;
      ctx.ui.notify("Safe mode enabled", "success");
    },
  });

  pi.registerCommand("unsafe", {
    description: "Disable safe mode (no approval gates)",
    handler: async (_args, ctx) => {
      safeModeEnabled = false;
      ctx.ui.notify("Safe mode disabled", "warning");
    },
  });

  pi.on("tool_call", async (event, ctx) => {
    if (!safeModeEnabled) return;

    switch (event.toolName) {
      case "read":
        return handleReadTool(event as any, ctx);
      case "grep":
        return handleGrepTool();
      case "find":
        return handleFindTool();
      case "ls":
        return handleLsTool();
      case "edit":
        return handleEditTool(event as any, ctx);
      case "write":
        return handleWriteTool(event as any, ctx);
      case "bash":
        return handleBashTool(event as any, ctx);
      default:
        return;
    }
  });
}
