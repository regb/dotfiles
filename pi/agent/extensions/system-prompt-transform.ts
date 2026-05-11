import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

type PromptTransform = {
  name: string;
  transform: (prompt: string) => string;
};

const REGISTRY_KEY = "__piSystemPromptTransforms";

type GlobalWithRegistry = typeof globalThis & {
  [REGISTRY_KEY]?: PromptTransform[];
};

function getRegistry(): PromptTransform[] {
  const g = globalThis as GlobalWithRegistry;
  if (!g[REGISTRY_KEY]) g[REGISTRY_KEY] = [];
  return g[REGISTRY_KEY]!;
}

export function registerSystemPromptTransform(name: string, transform: (prompt: string) => string): void {
  const registry = getRegistry();
  const idx = registry.findIndex((t) => t.name === name);
  const entry: PromptTransform = { name, transform };
  if (idx >= 0) registry[idx] = entry;
  else registry.push(entry);
}

export function getSystemPromptTransformNames(): string[] {
  return getRegistry().map((t) => t.name);
}

export function applySystemPromptTransforms(prompt: string): string {
  return getRegistry().reduce((acc, t) => t.transform(acc), prompt);
}

export default function systemPromptTransformExtension(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event) => {
    return {
      systemPrompt: applySystemPromptTransforms(event.systemPrompt),
    };
  });
}
