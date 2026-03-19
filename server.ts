import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route to fetch and extract text from a URL
  app.post("/api/fetch-url", async (req, res) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        },
        timeout: 15000,
      });

      const dom = new JSDOM(response.data, { url });
      const reader = new Readability(dom.window.document, {
        charThreshold: 20,
        classesToPreserve: ["article", "post", "entry"],
      });
      
      const article = reader.parse();

      if (!article || !article.textContent || article.textContent.trim().length < 100) {
        return res.status(422).json({ 
          error: "記事本文を正確に抽出できませんでした。ページが動的に生成されているか、テキストが少なすぎる可能性があります。" 
        });
      }

      // Clean up the text: 
      // 1. Remove excessive newlines
      // 2. Remove common "noise" phrases at the start/end
      // 3. Ensure it's not just a list of links
      let cleanedText = article.textContent
        .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines
        .trim();

      // Basic heuristic to filter out non-article pages (like login screens or link lists)
      const lines = cleanedText.split('\n').filter(l => l.trim().length > 0);
      const avgLineLength = cleanedText.length / lines.length;
      
      if (avgLineLength < 15 && lines.length > 20) {
        return res.status(422).json({ 
          error: "本文の抽出に失敗しました。リンク集やナビゲーションページである可能性があります。" 
        });
      }

      // Prepend title if available
      const finalContent = article.title ? `${article.title}\n\n${cleanedText}` : cleanedText;

      res.json({ text: finalContent });
    } catch (error: any) {
      console.error("Error fetching URL:", error.message);
      let message = "URLの取得に失敗しました。";
      if (error.code === 'ECONNABORTED') message = "タイムアウトしました。サーバーの応答が遅すぎます。";
      if (error.response?.status === 403) message = "アクセスが拒否されました。このサイトは自動取得を制限している可能性があります。";
      
      res.status(500).json({ error: message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
