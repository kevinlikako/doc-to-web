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
        // Handle DOCX files
        if (fileExt === ".docx") {
          try {
            const result = await mammoth.convertToHtml({ path: filePath });
            htmlContent = result.value;
          } catch (docxError) {
            console.error("DOCX conversion error:", docxError);
            res.status(400).json({ error: "Failed to process DOCX. Please upload a valid DOCX file." });
            return;
          }

        // Handle PDF files with error handling
        } else if (fileExt === ".pdf") {
          try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            htmlContent = `<pre>${data.text}</pre>`;
          } catch (pdfError) {
            console.error("PDF conversion error:", pdfError);
            res.status(400).json({ error: "Failed to process PDF. Please upload a valid PDF file." });
            return;
          }

        // Handle Markdown files
        } else if (fileExt === ".md") {
          try {
            const md = new MarkdownIt();
            const markdownText = fs.readFileSync(filePath, "utf8");
            htmlContent = md.render(markdownText);
          } catch (mdError) {
            console.error("Markdown conversion error:", mdError);
            res.status(400).json({ error: "Failed to process Markdown. Please upload a valid .md file." });
            return;
          }

        // Unsupported file types
        } else {
          res.status(400).json({ error: "Unsupported file type. Please upload a PDF, DOCX, or Markdown file." });
          return;
        }

        // Save the converted HTML in the /tmp directory
        const outputFilePath = path.join(tempDir, `${fileName}.html`);
        fs.writeFileSync(outputFilePath, htmlContent);

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