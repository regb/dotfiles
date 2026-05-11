import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execFile } from "node:child_process";
import TurndownService from "turndown";
import { Text } from "@earendil-works/pi-tui";
import browserExtension from "./browser";

function parseToolsFlag(argv: string[]): Set<string> | null {
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--tools" || arg === "-t") {
			const value = argv[i + 1] ?? "";
			return new Set(value.split(",").map((s) => s.trim()).filter(Boolean));
		}
		if (arg.startsWith("--tools=")) {
			return new Set(
				arg
					.slice("--tools=".length)
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean),
			);
		}
	}
	return null;
}

function curlFetch(url: string, signal?: AbortSignal): Promise<string> {
	return new Promise((resolve, reject) => {
		const child = execFile(
			"curl",
			["-L", "--silent", "--show-error", "--max-time", "20", url],
			{ maxBuffer: 1024 * 1024 },
			(error, stdout, stderr) => {
				if (error) {
					reject(new Error(stderr || error.message));
					return;
				}
				resolve(String(stdout));
			},
		);

		if (signal) {
			const onAbort = () => child.kill("SIGTERM");
			signal.addEventListener("abort", onAbort, { once: true });
		}
	});
}

const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

export default function webfetchExtension(pi: ExtensionAPI) {
	pi.registerTool({
		name: "fetch",
		label: "Web Fetch",
		description: "Fetch a URL and return response body as markdown text",
		promptSnippet: "Fetch and convert web pages to markdown",
		promptGuidelines: [
			"Use fetch when the user asks to read or summarize a web page from a URL",
			"Prefer fetch for static content extraction and in case it's not enough fallback on `agent-browser` cli through the bash tool",
		],
		parameters: Type.Object({
			url: Type.String({ description: "http(s) URL to fetch" }),
			includeScriptsStyles: Type.Optional(
				Type.Boolean({ description: "Include JS/CSS content in output (default: false)" }),
			),
		}),
		renderCall(args, theme) {
			const includeScriptsStyles = args.includeScriptsStyles ?? false;
			return new Text(
				theme.fg("toolTitle", theme.bold("fetch ")) +
					theme.fg("muted", args.url) +
					"\n" +
					theme.fg("dim", `  includeScriptsStyles=${includeScriptsStyles}`),
				0,
				0,
			);
		},
		async execute(_toolCallId, params, signal) {
			const html = await curlFetch(params.url, signal);
			const includeScriptsStyles = params.includeScriptsStyles ?? false;
			const cleanedHtml = includeScriptsStyles
				? html
				: html
						.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
						.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
			const markdown = turndown.turndown(cleanedHtml);
			return {
				content: [{ type: "text", text: markdown }],
				details: { includeScriptsStyles },
			};
		},
	});

	browserExtension(pi);

	pi.on("session_start", async () => {
		const extensionTools = new Set([
			"fetch",
			"browser_start",
			"browser_navigate",
			"browser_eval",
			"browser_screenshot",
			"browser_stop",
		]);
		const requested = parseToolsFlag(process.argv);
		if (requested === null) {
			pi.setActiveTools(pi.getActiveTools().filter((t) => !extensionTools.has(t)));
			return;
		}
		pi.setActiveTools(
			pi
				.getActiveTools()
				.filter((t) => !extensionTools.has(t) || requested.has(t)),
		);
	});
}
