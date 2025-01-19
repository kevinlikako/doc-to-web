import formidable from "formidable";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

// Disable Next.js default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Formidable parsing error:", err);
      return res.status(500).json({ error: "Error parsing the file" });
    }

    if (!files || !files.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const uploadedFile = files.file[0];
      const filePath = uploadedFile.filepath;
      const fileName = uploadedFile.originalFilename;
      const fileExt = path.extname(fileName).toLowerCase();
      let htmlContent = "";

      if (fileExt === ".docx") {
        const result = await mammoth.convertToHtml({ path: filePath });
        htmlContent = result.value;
      } else if (fileExt === ".pdf") {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        htmlContent = `<pre>${data.text}</pre>`;
      } else {
        return res.status(400).json({ error: "Unsupported file type. Please upload a PDF or DOCX." });
      }

      // Create an HTML file with the document content
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
                    color: #202124;
                    padding: 40px;
                    max-width: 900px;
                    margin: auto;
                    line-height: 1.6;
                    background-color: #fff;
                }
                img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 5px;
                }
                p {
                    margin: 20px 0;
                }
                h1, h2, h3 {
                    color: #1a73e8;
                }
                a {
                    color: #1a73e8;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            ${htmlContent}
        </body>
        </html>
      `;

      const outputFilePath = path.join("/tmp", `${fileName}.html`);
      fs.writeFileSync(outputFilePath, modernTemplate);

      res.status(200).json({ url: `/api/preview?file=${fileName}.html` });
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json({ error: "File processing failed" });
    }
  });
}