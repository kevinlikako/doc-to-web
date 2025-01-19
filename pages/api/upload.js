import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import cloudconvert from "cloudconvert";
import jsdom from "jsdom";

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const CLOUDCONVERT_API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNTYzMzJhYThkNTQ3ZjljZjhjOTQzZDM3NmFkMzA3ZDY2N2UxNjdhMzZmZDBkMGIxYjViYzcyNDc5NmIyZGUwZTM3MTdlZjY4M2FhNTJiYTIiLCJpYXQiOjE3MzczMTI2ODMuNDEzNDUyLCJuYmYiOjE3MzczMTI2ODMuNDEzNDU0LCJleHAiOjQ4OTI5ODYyODMuNDEwMzI2LCJzdWIiOiI3MDc5NDk0NSIsInNjb3BlcyI6WyJ0YXNrLnJlYWQiLCJ0YXNrLndyaXRlIl19.V2gU_rWXaAfcZZ4l0OQ0SrcNDSKQqjHbzBEs_W65_89Y034lGo8GaY9PBpiLJP0-QNvJD8TSdjoomPDFnkCYPoVMWkM2grNtHld-9ZcepNPgfo-0GF9fyC74Z2iAsAiS4mm4NYVZ113e604lTwnuIcGAp1NBGNF4XKIzEN_ZCDavjyqYrx_tlZhaVmX9o-g0_h4CX-QvZ5qIpmulLDBzr0FkF7nfD5FEFD5Hj0KcfPMaj8G1PIWZZHOBAUbCXk171YM36MHtjsyT06MTx9nunVQFt9UIRSh0un3B8pm5bugp34-yjSFCtZOqjgNUV-2F0oW5tid1icfAafUcdjLM23Ktdqqu7TCJaQtrJgd2tKVC-BU6BXOw7A_CLAUFSLTXhA5vLtn6qen2pjFFgIhrbG4HHIhbJjRFWldK1oCMtz7P6I9cP7tjOXFwDegmAiD0J3gNo4PBYcEUVvTU7cs_IrusPNmlcK1oMLsjqsM0oPMxebEwJ77owAHdhpLf1tW0I9JU7uK6Rl9ZFDeCk3Y2NYpT5tnc6oSJdXZuVn87oJL46LCzP6gzNPuQb99g2BsEN7AKU-2tsol_VUlf3-DmBvgUiN6jPwIRkj2rDCGs717A4wfmfzi8uDOtcFb_dK0uxX3uF4MuX5Bi1qNQwOm__5Z-N9rNebCis8bfYN3JzWk"; // Add your CloudConvert API key

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
          const result = await mammoth.convertToHtml({ path: filePath, includeEmbeddedStyleMap: true });
          htmlContent = result.value;
        } else if (fileExt === ".pdf") {
          const cloudConvertInstance = new cloudconvert(CLOUDCONVERT_API_KEY);
          const job = await cloudConvertInstance.jobs.create({
            tasks: {
              import: {
                operation: "import/upload",
              },
              convert: {
                operation: "convert",
                input: "import",
                output_format: "html",
              },
              export: {
                operation: "export/url",
                input: "convert",
              },
            },
          });

          const uploadTask = job.tasks.find((task) => task.operation === "import/upload");
          const fileStream = fs.createReadStream(filePath);
          await cloudConvertInstance.tasks.upload(uploadTask, fileStream);

          const exportedFiles = job.tasks.find((task) => task.operation === "export/url").result.files;
          const response = await fetch(exportedFiles[0].url);
          htmlContent = await response.text();
        } else if (fileExt === ".md") {
          const markdownText = fs.readFileSync(filePath, "utf8");
          const md = new jsdom.JSDOM(markdownText);
          htmlContent = md.window.document.body.innerHTML;
        } else {
          res.status(400).json({ error: "Unsupported file type" });
          return;
        }

        // Modern HTML template without page breaks
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
                  img, video {
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