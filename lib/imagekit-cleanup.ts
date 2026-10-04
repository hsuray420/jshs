import { enqueueExternalMediaCleanup, listExternalMediaCleanup, resolveExternalMediaCleanup } from "../db/admin-store";
import { deleteImageKitFile } from "./imagekit-server";

/** Retries only metadata already queued after a successful replacement. */
export async function processImageKitCleanupQueue() {
  const tasks = await listExternalMediaCleanup(20);
  for (const task of tasks) {
    if (task.provider !== "imagekit") continue;
    try { await deleteImageKitFile(task.file_id); await resolveExternalMediaCleanup(task.id); }
    catch (error) {
      await enqueueExternalMediaCleanup({ provider: "imagekit", fileId: task.file_id, error: error instanceof Error ? error.message : "cleanup_failed" });
    }
  }
}
