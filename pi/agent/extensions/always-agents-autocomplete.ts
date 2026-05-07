import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { AutocompleteItem, AutocompleteProvider, AutocompleteSuggestions } from "@mariozechner/pi-tui";

const MAX_SUGGESTIONS = 40;

function extractAtToken(textBeforeCursor: string): string | undefined {
  const match = textBeforeCursor.match(/(?:^|[ \t])(@[^\s]*)$/);
  return match?.[1];
}

function shSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

async function getFzfMatches(pi: ExtensionAPI, cwd: string, query: string): Promise<string[] | null> {
  const escapedQuery = shSingleQuote(query);
  const command = [
    "(fd --type f --hidden --follow --exclude .git . 2>/dev/null || rg --files --hidden -g '!.git' 2>/dev/null || find . -type f 2>/dev/null)",
    `| fzf --filter ${escapedQuery}`,
    `| head -n ${MAX_SUGGESTIONS}`,
  ].join(" ");

  const result = await pi.exec("bash", ["-lc", command], { cwd, timeout: 4_000 });
  // fzf returns exit code 1 when no matches are found; treat that as a valid empty result.
  if (result.code !== 0) {
    if (result.code === 1) return [];
    return null;
  }

  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\.\//, ""));
}

function toItem(path: string): AutocompleteItem {
  const name = path.split("/").pop() || path;
  return {
    value: `@${path}`,
    label: name,
    description: path,
  };
}

function createProvider(pi: ExtensionAPI, cwd: string, hasFzf: boolean, current: AutocompleteProvider): AutocompleteProvider {
  return {
    async getSuggestions(lines, cursorLine, cursorCol, options): Promise<AutocompleteSuggestions | null> {
      const line = lines[cursorLine] ?? "";
      const textBeforeCursor = line.slice(0, cursorCol);
      const atToken = extractAtToken(textBeforeCursor);

      if (!atToken) {
        return current.getSuggestions(lines, cursorLine, cursorCol, options);
      }

      if (!hasFzf) {
        return current.getSuggestions(lines, cursorLine, cursorCol, options);
      }

      const query = atToken.slice(1);
      const matches = await getFzfMatches(pi, cwd, query);
      if (options.signal.aborted) return null;

      if (matches === null) {
        return current.getSuggestions(lines, cursorLine, cursorCol, options);
      }

      return {
        prefix: atToken,
        items: matches.map(toItem),
      };
    },

    applyCompletion(lines, cursorLine, cursorCol, item, prefix) {
      return current.applyCompletion(lines, cursorLine, cursorCol, item, prefix);
    },

    shouldTriggerFileCompletion(lines, cursorLine, cursorCol) {
      return current.shouldTriggerFileCompletion?.(lines, cursorLine, cursorCol) ?? true;
    },
  };
}

export default function (pi: ExtensionAPI): void {
  pi.on("session_start", async (_event, ctx) => {
    const fzfCheck = await pi.exec("bash", ["-lc", "command -v fzf >/dev/null 2>&1"], {
      cwd: ctx.cwd,
      timeout: 2_000,
    });
    const hasFzf = fzfCheck.code === 0;

    ctx.ui.addAutocompleteProvider((current) => createProvider(pi, ctx.cwd, hasFzf, current));
    if (hasFzf) {
      ctx.ui.notify("fzf @ autocomplete loaded (builtin @ matcher overridden)", "info");
    } else {
      ctx.ui.notify("fzf not found: using builtin @ autocomplete", "warning");
    }
  });
}
