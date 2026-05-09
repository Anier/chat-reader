import { Context } from "hono";
import { readdir } from "node:fs/promises";
import path from "node:path";

export default async (c: Context) => {
  const baseDir = path.join(process.cwd(), "jsons");
  const selectedFolder = c.req.query("folder") || "jsons";
  
  try {
    // Get all subdirectories for folder list
    const entries = await readdir(baseDir, { withFileTypes: true });
    const folders = entries
      .filter(e => e.isDirectory())
      .map(e => ({ name: e.name, path: e.name }));
    
    // Add jsons if not present
    const allFolders = [{ name: "jsons", path: "jsons" }, ...folders.filter(f => f.path !== "jsons")];
    
    // Get files from selected folder
    const safeFolder = selectedFolder.replace(/[^a-zA-Z0-9_-]/g, "");
    const folderPath = `${baseDir}/${safeFolder}`;
    
    let files: { name: string; path: string }[] = [];
    try {
      const dirEntries = await readdir(folderPath);
      files = dirEntries
        .filter(f => f.endsWith(".json") || f.endsWith(".jsonl"))
        .map(f => ({ name: f, path: f }))
        .sort((a, b) => b.name.localeCompare(a.name));
    } catch {
      // Folder doesn't exist, return empty files
    }
    
    return c.json({ folders: allFolders, files });
  } catch (e) {
    return c.json({ error: "Failed to read", folders: [], files: [] }, 500);
  }
};
