import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerSystemPromptTransform } from "./system-prompt-transform";

const PI_DOCS_HEADER =
  "Pi documentation (read only when the user asks about pi itself, its SDK, extensions, themes, skills, or TUI):";
const PI_DOCS_FOOTER =
  "- Always read pi .md files completely and follow links to related docs (e.g., tui.md for TUI API details)";

function stripPiDocsBlock(prompt: string): string {
  const start = prompt.indexOf(PI_DOCS_HEADER);
  if (start < 0) return prompt;

  const footerIndex = prompt.indexOf(PI_DOCS_FOOTER, start);
  if (footerIndex < 0) return prompt;

  const end = footerIndex + PI_DOCS_FOOTER.length;

  // Remove adjacent blank lines to keep formatting clean.
  let removeStart = start;
  while (removeStart > 0 && prompt[removeStart - 1] === "\n") removeStart--;

  let removeEnd = end;
  while (removeEnd < prompt.length && prompt[removeEnd] === "\n") removeEnd++;

  return `${prompt.slice(0, removeStart)}\n\n${prompt.slice(removeEnd)}`.trimEnd();
}

export default function stripPiDocsExtension(_pi: ExtensionAPI) {
  registerSystemPromptTransform("strip-pi-docs", stripPiDocsBlock);
}
