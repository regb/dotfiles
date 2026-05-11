import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * /review - branch from root for isolated review work
 * /end-review [custom summary instructions] - return to origin with branch summary
 */
export default function (pi: ExtensionAPI) {
  let reviewOriginId: string | undefined;

  pi.registerCommand("review", {
    description: "Start a review branch from root, then /end-review to return with summary",
    handler: async (_args, ctx) => {
      reviewOriginId = ctx.sessionManager.getLeafId();

      const entries = ctx.sessionManager.getEntries();
      const rootEntry = entries.find((e: any) => e.parentId === null);
      if (!rootEntry) {
        ctx.ui.notify("No root entry found in session", "error");
        return;
      }

      const result = await ctx.navigateTree(rootEntry.id, { summarize: false });
      if (result.cancelled) return;

      pi.appendEntry("review_start", {
        originId: reviewOriginId,
        startedAt: new Date().toISOString(),
      });

      ctx.ui.notify(
        "Review branch started from root. Work normally, then use /end-review.",
        "info",
      );
    },
  });

  pi.registerCommand("end-review", {
    description: "Return to pre-review position and attach branch summary",
    handler: async (args, ctx) => {
      if (!reviewOriginId) {
        ctx.ui.notify("Not in a review branch (use /review first)", "error");
        return;
      }

      const reviewBranch = ctx.sessionManager.getBranch();
      const result = await ctx.navigateTree(reviewOriginId, {
        summarize: true,
        customInstructions: args || undefined,
      });

      if (result.cancelled) return;

      pi.appendEntry("review_complete", {
        reviewEntryCount: reviewBranch.length,
        completedAt: new Date().toISOString(),
        customInstructions: args || undefined,
      });

      ctx.ui.notify(
        `Review complete. Returned to original position. Review entries: ${reviewBranch.length}.`,
        "info",
      );

      reviewOriginId = undefined;
    },
  });
}
