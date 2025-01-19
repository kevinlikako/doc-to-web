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

        // Save the converted HTML in the /tmp directory
        const outputFilePath = path.join(tempDir, `${fileName}.html`);
        fs.writeFileSync(outputFilePath, htmlContent);

        res.status(200).json({ url: `/api/preview?file=${fileName}.html` });

      } catch (conversionError) {
        console.error("Error during file conversion:", conversionError);
        res.status(500).json({ error: "Conversion failed" });
      }
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}