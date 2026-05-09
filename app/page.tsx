"use client";

import { useState, useRef, useCallback } from "react";

interface ChatMessage {
  id: string;
  type: "user" | "gemini";
  timestamp: string;
  content: string;
}

interface ChatData {
  sessionId: string;
  startTime: string;
  lastUpdated: string;
  messages: ChatMessage[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseMarkdown(text: string): string {
  if (!text) return "";
  
  // Escape HTML first
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="bg-slate-900 rounded-lg p-3 overflow-x-auto text-sm my-2"><code>${code.trim()}</code></pre>`;
  });
  
  // Inline code (`...`)
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-300 text-sm">$1</code>');
  
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-4 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-4 mb-2">$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/_(.+?)_/g, '<em class="italic">$1</em>');
  
  // Lists
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4">• $1</li>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$1. $2</li>');
  html = html.replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc my-2">$&</ul>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-cyan-400 hover:underline">$1</a>');
  
  // Paragraphs (double newlines)
  html = html.replace(/\n\n/g, '</p><p class="mb-3">');
  
  // Single newlines to <br>
  html = html.replace(/\n/g, '<br>');
  
  return `<p class="mb-3">${html}</p>`;
}

export default function ChatReader() {
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const toggleMessage = (id: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const processFileContent = (content: string) => {
    setExpandedMessages(new Set()); // Reset on new file
    try {
      let messages: any[] = [];
      let sessionId = "";
      let startTime = "";
      let lastUpdated = "";

      // Try to detect if it's JSONL
      const trimmed = content.trim();
      if (trimmed.includes("\n") && trimmed.startsWith("{")) {
        const lines = trimmed.split("\n");
        try {
          const firstLine = JSON.parse(lines[0]);
          if (firstLine.sessionId) {
            // It's likely our JSONL format
            sessionId = firstLine.sessionId;
            startTime = firstLine.startTime;
            lastUpdated = firstLine.lastUpdated;
            
            messages = lines.slice(1).map(line => {
              try {
                const m = JSON.parse(line);
                if (m.$set || (m.type !== "user" && m.type !== "gemini")) return null;
                
                let text = "";
                if (typeof m.content === "string") text = m.content;
                else if (Array.isArray(m.content)) text = m.content.map((c: any) => c.text || "").join("\n");
                
                if (!text.trim()) return null;
                
                return { 
                  id: m.id, 
                  type: m.type === "gemini" ? "gemini" : "user", 
                  timestamp: m.timestamp, 
                  content: text.trim() 
                };
              } catch { return null; }
            }).filter(Boolean);

            setChatData({ sessionId, startTime, lastUpdated, messages });
            return;
          }
        } catch {
          // Fall through to regular JSON
        }
      }

      // Regular JSON format
      const raw = JSON.parse(content);
      messages = (raw.messages || []).filter((m: any) => {
        if (m.type === "info") return false;
        const msgContent = m.content;
        if (typeof msgContent === "string") return msgContent.trim().length > 0;
        if (Array.isArray(msgContent)) return msgContent.some((c: any) => c.text?.trim());
        return false;
      }).map((m: any) => {
        let text = "";
        if (typeof m.content === "string") text = m.content;
        else if (Array.isArray(m.content)) text = m.content.map((c: any) => c.text || "").join("\n");
        return { 
          id: m.id, 
          type: m.type === "gemini" ? "gemini" : "user", 
          timestamp: m.timestamp, 
          content: text.trim() 
        };
      });
      setChatData({ 
        sessionId: raw.sessionId || "", 
        startTime: raw.startTime || "", 
        lastUpdated: raw.lastUpdated || "", 
        messages 
      });
    } catch {
      setError("Не удалось распознать файл");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setError(null);
    setChatData(null);

    const reader = new FileReader();
    reader.onload = (e) => processFileContent(e.target?.result as string);
    reader.onerror = () => { setError("Ошибка чтения файла"); setLoading(false); };
    reader.readAsText(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setError(null);
    setChatData(null);

    const reader = new FileReader();
    reader.onload = (e) => processFileContent(e.target?.result as string);
    reader.onerror = () => { setError("Ошибка чтения файла"); setLoading(false); };
    reader.readAsText(file);
  }, []);

  return (
    <div className={isFullscreen ? "fixed inset-0 z-50 bg-slate-900 flex flex-col" : "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4"}>
      {!isFullscreen && (
        <header className="text-center mb-6">
          <h1 className="text-4xl font-black text-white mb-2">📖 JSON GEMINI Chat Reader</h1>
          <p className="text-slate-400">Загрузите JSON или JSONL файл сессии чата с Gemini</p>
        </header>
      )}

      {isFullscreen && (
        <button onClick={toggleFullscreen} className="absolute top-4 right-4 w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition z-10">✕</button>
      )}

      {!chatData && !loading && (
        <div onDragOver={handleDragOver} onDrop={handleDrop} className="bg-slate-800 rounded-2xl p-8 border border-slate-700 hover:border-cyan-600 transition-colors max-w-2xl mx-auto w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center text-4xl">📁</div>
            <label className="cursor-pointer">
              <input type="file" accept=".json,.jsonl" onChange={handleFileUpload} className="hidden" />
              <span className="inline-block px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition">Выбрать файл</span>
            </label>
            <p className="text-slate-400 text-sm">или перетащите файл сюда (поддерживаются .json и .jsonl)</p>
          </div>
        </div>
      )}

      {loading && <div className="flex items-center justify-center py-20"><div className="animate-spin text-5xl">⏳</div></div>}
      {error && <div className="bg-red-900/50 border border-red-700 rounded-xl p-4 text-red-200 max-w-2xl mx-auto">{error}</div>}

      {chatData && (
        <div className={`${isFullscreen ? "flex-1 flex flex-col min-h-0" : "max-w-4xl mx-auto w-full"}`}>
          <div className="flex items-center justify-between mb-4 px-2">
            <button onClick={() => { setChatData(null); setFileName(""); }} className="text-slate-400 hover:text-white transition flex items-center gap-2">← Загрузить другой файл</button>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm">{chatData.messages.length} сообщений</span>
              <button onClick={toggleFullscreen} className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition" title="Развернуть на весь экран">{isFullscreen ? "⤓" : "⤢"}</button>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700 flex flex-col min-h-0" style={isFullscreen ? { flex: 1, maxHeight: "calc(100vh - 120px)" } : { maxHeight: "calc(100vh - 280px)" }}>
            <div className="p-4 bg-slate-800 border-b border-slate-700 shrink-0">
              <div className="font-bold text-white">{fileName}</div>
              <div className="text-xs text-slate-400">Начало: {formatDate(chatData.startTime)}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              {chatData.messages.map((msg) => {
                const isExpanded = expandedMessages.has(msg.id);
                return (
                  <div key={msg.id} className={`flex flex-col ${msg.type === "user" ? "items-end" : "items-start"}`}>
                    {msg.type === "gemini" && (
                      <button 
                        onClick={() => toggleMessage(msg.id)}
                        className="mb-2 px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors border border-slate-600 flex items-center gap-2"
                      >
                        {isExpanded ? "Скрыть ответ" : "Показать ответ"} 
                        <span className="opacity-50">{isExpanded ? "▲" : "▼"}</span>
                      </button>
                    )}
                    
                    {(msg.type === "user" || isExpanded) && (
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.type === "user" ? "bg-cyan-600 text-white rounded-br-md" : "bg-slate-700 text-slate-100 rounded-bl-md shadow-lg border border-slate-600"}`}>
                        <div className="text-xs opacity-70 mb-1">{formatDate(msg.timestamp)}</div>
                        <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
