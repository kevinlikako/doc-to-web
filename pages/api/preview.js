import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const { file } = req.query;
  const filePath = path.join("/tmp", file);

  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    res.setHeader("Content-Type", "text/html");
    res.status(200).send(fileContent);
  } else {
    res.status(404).send("File not found.");
  }
}