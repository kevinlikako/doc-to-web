import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import MarkdownIt from "markdown-it";

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const tempDir = path.join("/tmp", "uploads");

    // Ensure the temporary directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const form = new IncomingForm();
    form.uploadDir = tempDir;
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error during file upload:", err);
        res.status(500).json({ error: "Upload failed" });
        return;
      }

      const file = files.file[0];
      const filePath = file.filepath;
      const fileName = file.originalFilename;
      const fileExt = path.extname(fileName).toLowerCase();

      let htmlContent = "";

      try {
        // Convert DOCX
        if (fileExt === ".docx") {
          const result = await mammoth.convertToHtml({ path: filePath });
          htmlContent = result.value;

        // Convert PDF
        } else if (fileExt === ".pdf") {
          const dataBuffer = fs.readFileSync(filePath);
          const data = await pdfParse(dataBuffer);
          htmlContent = `<pre>${data.text}</pre>`;

        // Convert Markdown
        } else if (fileExt === ".md") {
          const md = new MarkdownIt();
          const markdownText = fs.readFileSync(filePath, "utf8");
          htmlContent = md.render(markdownText);

        } else {
          res.status(400).json({ error: "Unsupported file type" });
          return;
        }

        // 🌟 Modernized HTML Template 🌟
        const modernTemplate = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${fileName}</title>
              <style>
                  body {
                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                      background-color: #f9f9f9;
                      color: #333;
                      padding: 40px;
                      max-width: 800px;
                      margin: auto;
                      line-height: 1.6;
                  }
                  h1, h2, h3 {
                      color: #222;
                  }
                  a {
                      color: #0070f3;
                      text-decoration: none;
                  }
                  img {
                      max-width: 100%;
                      border-radius: 8px;
                  }
              </style>
          </head>
          <body>
              ${htmlContent}
          </body>
          </html>
        `;

        // Save the styled HTML
        const outputFilePath = path.join(tempDir, `${fileName}.html`);
        fs.writeFileSync(outputFilePath, modernTemplate);

        res.status(200).json({ url: `/api/preview?file=${fileName}.html` });

      } catch (conversionError) {
        console.error("Error during file conversion:", conversionError);
        res.status(500).json({ error: "Conversion failed. Please try again." });
      }
    });

  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}