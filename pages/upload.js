import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    const allowedTypes = [".pdf", ".docx", ".md"];

    // Check if the file type is allowed
    if (selectedFile) {
      const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
      if (!allowedTypes.includes(fileExt)) {
        alert("Invalid file type. Please upload a PDF, DOCX, or Markdown (.md) file.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a valid file to upload.");
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        setProgress(percentComplete);
      }
    });

    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        setUploading(false);
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setLink(response.url);
        } else {
          alert("Upload failed. Please try again.");
        }
      }
    };

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Upload Your Document</h1>
      <p>Accepted file types: <strong>PDF (.pdf), Word Document (.docx), Markdown (.md)</strong></p>

      <input type="file" onChange={handleFileChange} />

      <button
        onClick={handleUpload}
        style={{ padding: "10px 20px", marginLeft: "10px", cursor: uploading ? "not-allowed" : "pointer" }}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {uploading && (
        <div style={{ width: "50%", margin: "20px auto", border: "1px solid #ccc", borderRadius: "5px" }}>
          <div
            style={{
              width: `${progress}%`,
              height: "20px",
              backgroundColor: "#4caf50",
              transition: "width 0.3s ease-in-out",
            }}
          ></div>
        </div>
      )}

      {link && (
        <p>
          🎉 Your document is ready! View it here:{" "}
          <a href={link} target="_blank" rel="noopener noreferrer">
            {link}
          </a>
        </p>
      )}
    </div>
  );
}