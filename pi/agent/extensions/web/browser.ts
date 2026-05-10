import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execFile } from "node:child_process";
import { Text } from "@earendil-works/pi-tui";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function runScript(script: string, args: string[], signal?: AbortSignal): Promise<string> {
	return new Promise((resolveOut, reject) => {
		const child = execFile(
			"node",
			[resolve(here, script), ...args],
			{ env: { ...process.env }, maxBuffer: 1024 * 1024 },
			(err, stdout, stderr) => {
				if (err) return reject(new Error(stderr || err.message));
				resolveOut(String(stdout).trim());
			},
		);
		if (signal) signal.addEventListener("abort", () => child.kill("SIGTERM"), { once: true });
	});
}

export default function browserExtension(pi: ExtensionAPI) {
	pi.registerTool({
		name: "browser_start",
		label: "Start Chrome",
		description: "Start Chrome with remote debugging on :9222",
		parameters: Type.Object({
			width: Type.Optional(Type.Number({ description: "Viewport width in px (e.g. 1920)" })),
			height: Type.Optional(Type.Number({ description: "Viewport height in px (e.g. 1080)" })),
		}),
		renderCall(args, theme) {
			return new Text(
				theme.fg("toolTitle", theme.bold("browser_start ")) +
					theme.fg("dim", `viewport=${args.width ?? 1280}x${args.height ?? 720}`),
				0,
				0,
			);
		},
		async execute(_id, params, signal) {
			const runArgs = [
				...(params.width ? ["--width", String(params.width)] : []),
				...(params.height ? ["--height", String(params.height)] : []),
			];
			const out = await runScript("start.js", runArgs, signal);
			return { content: [{ type: "text", text: out }] };
		},
	});

	pi.registerTool({
		name: "browser_navigate",
		label: "Navigate",
		description: "Navigate current tab",
		parameters: Type.Object({
			url: Type.String({ description: "URL to open" }),
		}),
		renderCall(args, theme) {
			return new Text(theme.fg("toolTitle", theme.bold("browser_navigate ")) + theme.fg("muted", args.url), 0, 0);
		},
		async execute(_id, params, signal) {
			const out = await runScript("nav.js", [params.url], signal);
			return { content: [{ type: "text", text: out }] };
		},
	});

	pi.registerTool({
		name: "browser_eval",
		label: "Evaluate JavaScript",
		description: "Execute JavaScript in the active tab",
		parameters: Type.Object({
			script: Type.String({ description: "JavaScript expression/code" }),
		}),
		renderCall(args, theme) {
			return new Text(theme.fg("toolTitle", theme.bold("browser_eval ")) + theme.fg("dim", args.script), 0, 0);
		},
		async execute(_id, params, signal) {
			const out = await runScript("eval.js", [params.script], signal);
			return { content: [{ type: "text", text: out }] };
		},
	});

	pi.registerTool({
		name: "browser_screenshot",
		label: "Screenshot",
		description: "Capture a screenshot of the current viewport",
		parameters: Type.Object({
			path: Type.String({ description: "Output file path (e.g. /tmp/shot.png)" }),
		}),
		renderCall(args, theme) {
			return new Text(
				theme.fg("toolTitle", theme.bold("browser_screenshot ")) + theme.fg("muted", args.path),
				0,
				0,
			);
		},
		async execute(_id, params, signal) {
			const out = await runScript("screenshot.js", [params.path], signal);
			return { content: [{ type: "text", text: out }] };
		},
	});

	pi.registerTool({
		name: "browser_stop",
		label: "Stop Chrome",
		description: "Stop Chrome started on :9222",
		parameters: Type.Object({}),
		renderCall(_args, theme) {
			return new Text(theme.fg("toolTitle", theme.bold("browser_stop")), 0, 0);
		},
		async execute(_id, _params, signal) {
			const out = await runScript("stop.js", [], signal);
			return { content: [{ type: "text", text: out }] };
		},
	});
}
