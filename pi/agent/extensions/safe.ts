import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import os from "node:os";
import path from "node:path";

const ALLOW_DENY_CHOICES = ["Allow", "Deny"];
const STATIC_ALLOWED_READ_ROOTS = [path.join(os.homedir(), ".pi")];

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

  const choice = await ctx.ui.select(
    `Pi wants to read outside allowlist:\n${absReadPath}\n\nAllowed roots:\n- ${allowedRoots.join("\n- ")}`,
    ALLOW_DENY_CHOICES,
  );
  if (choice !== "Allow") return { block: true, reason: "Blocked read outside allowlist: denied by user" };
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
  const choice = await ctx.ui.select(`Pi wants to edit ${target}?`, ALLOW_DENY_CHOICES);
  if (choice !== "Allow") return { block: true, reason: `Blocked ${event.toolName}: denied by user` };
}

async function handleWriteTool(event: { input: { path?: string }; toolName: string }, ctx: any) {
  if (!ctx.hasUI) {
    return { block: true, reason: `Blocked ${event.toolName}: no UI available for approval` };
  }

  const target = String(event.input.path ?? "<unknown file>");
  const choice = await ctx.ui.select(`Pi wants to write ${target}?`, ALLOW_DENY_CHOICES);
  if (choice !== "Allow") return { block: true, reason: `Blocked ${event.toolName}: denied by user` };
}

async function handleBashTool(event: { toolName: string; input: unknown }, ctx: any) {
  if (!ctx.hasUI) {
    return { block: true, reason: `Blocked ${event.toolName}: no UI available for approval` };
  }

  const command = String((event.input as { command?: string }).command ?? "<unknown command>");
  const choice = await ctx.ui.select(`Pi wants to run:\n$ ${command}`, ALLOW_DENY_CHOICES);
  if (choice !== "Allow") return { block: true, reason: `Blocked ${event.toolName}: denied by user` };
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
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
