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
        if (fileExt === ".docx") {
          const result = await mammoth.convertToHtml({ path: filePath });
          htmlContent = result.value;
        } else if (fileExt === ".pdf") {
          const dataBuffer = fs.readFileSync(filePath);
          const data = await pdfParse(dataBuffer);
          htmlContent = `<pre>${data.text}</pre>`;
        } else if (fileExt === ".md") {
          const md = new MarkdownIt();
          const markdownText = fs.readFileSync(filePath, "utf8");
          htmlContent = md.render(markdownText);
        } else {
          res.status(400).json({ error: "Unsupported file type" });
          return;
        }

        // Google Docs-like Styling Template
        const modernTemplate = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${fileName}</title>
              <style>
                  body {
                      font-family: Arial, sans-serif;
                      font-size: 18px;
                      background-color: #f5f5f5;
                      color: #202124;
                      padding: 40px;
                      max-width: 900px;
                      margin: auto;
                      line-height: 1.8;
                      box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
                      border-radius: 8px;
                      background-color: #fff;
                  }
                  h1 {
                      font-size: 32px;
                      font-weight: bold;
                      margin-bottom: 20px;
                      color: #1a73e8;
                  }
                  h2 {
                      font-size: 28px;
                      font-weight: bold;
                      margin-top: 30px;
                      color: #1a73e8;
                  }
                  h3 {
                      font-size: 24px;
                      font-weight: bold;
                      margin-top: 25px;
                      color: #1a73e8;
                  }
                  p {
                      margin: 20px 0;
                  }
                  ul, ol {
                      margin: 20px 0;
                      padding-left: 30px;
                  }
                  a {
                      color: #1a73e8;
                      text-decoration: none;
                  }
                  a:hover {
                      text-decoration: underline;
                  }
                  img {
                      max-width: 100%;
                      border-radius: 5px;
                  }
                  blockquote {
                      border-left: 4px solid #dadce0;
                      margin: 20px 0;
                      padding: 10px 20px;
                      font-style: italic;
                      color: #555;
                      background-color: #f8f9fa;
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