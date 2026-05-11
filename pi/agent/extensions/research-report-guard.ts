import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import fs from "node:fs";
import path from "node:path";

function isInside(root: string, target: string): boolean {
  const rel = path.relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function resolveTargetPath(cwd: string, p: unknown): string {
  const raw = String(p ?? "").replace(/^@/, "").trim();
  return path.resolve(cwd, raw);
}

export default function (pi: ExtensionAPI) {
  const reportDirRaw = process.env.REPORT_DIR;
  if (!reportDirRaw) {
    throw new Error("research-report-guard: REPORT_DIR is required. Start pi via the research launcher.");
  }

  const reportDir = path.resolve(reportDirRaw);
  if (!fs.existsSync(reportDir)) {
    throw new Error(`research-report-guard: REPORT_DIR does not exist: ${reportDir}`);
  }
  if (!fs.statSync(reportDir).isDirectory()) {
    throw new Error(`research-report-guard: REPORT_DIR is not a directory: ${reportDir}`);
  }

  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName !== "write" && event.toolName !== "edit") return;

    const targetPath = resolveTargetPath(ctx.cwd, (event.input as { path?: string })?.path);

    if (!targetPath || targetPath === path.resolve(ctx.cwd)) {
      return { block: true, reason: "Blocked: missing or invalid target path." };
    }

    if (!isInside(reportDir, targetPath)) {
      return {
        block: true,
        reason: `Blocked ${event.toolName}: destination must be inside REPORT_DIR (${reportDir}). Attempted: ${targetPath}`,
      };
    }

    return;
  });
}
