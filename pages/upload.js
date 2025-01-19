import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setLink(data.url);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Upload Your Document</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} style={{ padding: "10px 20px", marginLeft: "10px" }}>
        Upload
      </button>
      {link && (
        <p>
          View your document here:{" "}
          <a href={link} target="_blank" rel="noopener noreferrer">
            {link}
          </a>
        </p>
      )}
    </div>
  );
}