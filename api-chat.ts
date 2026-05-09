import { Context } from "hono";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export default async (c: Context) => {
  const filename = c.req.query("file");
  const folder = c.req.query("folder") || "jsons";
  
  if (!filename || (!filename.endsWith(".json") && !filename.endsWith(".jsonl"))) {
    return c.json({ error: "Invalid file" }, 400);
  }
  
  // Prevent path traversal
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = path.join(process.cwd(), "jsons", safeFolder, filename);
  
  try {
    const content = await readFile(filePath, "utf-8");
    let data: any;

    if (filename.endsWith(".jsonl")) {
      const lines = content.trim().split("\n");
      const firstLine = JSON.parse(lines[0]);
      
      const messages = lines.slice(1).map(line => {
        try {
          const parsed = JSON.parse(line);
          // Skip $set updates and only keep user/gemini messages
          if (parsed.$set || (parsed.type !== "user" && parsed.type !== "gemini")) return null;
          
          const text = extractContent(parsed.content);
          if (!text || text.trim() === "") return null;

          return {
            id: parsed.id,
            type: parsed.type,
            timestamp: parsed.timestamp,
            content: text
          };
        } catch {
          return null;
        }
      }).filter(Boolean);

      data = {
        sessionId: firstLine.sessionId,
        startTime: firstLine.startTime,
        lastUpdated: firstLine.lastUpdated,
        messages
      };
    } else {
      const rawData = JSON.parse(content);
      const messages = (rawData.messages || [])
        .filter((msg: any) => msg.type === "user" || msg.type === "gemini")
        .map((msg: any) => {
          const text = extractContent(msg.content);
          if (!text || text.trim() === "") return null;
          
          return {
            id: msg.id,
            type: msg.type,
            timestamp: msg.timestamp,
            content: text
          };
        })
        .filter(Boolean);

      data = { 
        sessionId: rawData.sessionId,
        startTime: rawData.startTime,
        lastUpdated: rawData.lastUpdated,
        messages 
      };
    }
    
    return c.json(data);
  } catch (e) {
    return c.json({ error: "Failed to read file" }, 500);
  }
};

function extractContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content.map((c: any) => typeof c === "string" ? c : c.text || "").join("").trim();
  }
  return String(content).trim();
}
