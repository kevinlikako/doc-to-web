import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    const allowedTypes = [".pdf", ".docx", ".md"];

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

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setUploading(false);

    if (response.ok) {
      setLink(data.url);
    } else {
      alert("Upload failed. Please try again.");
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f4f6f8',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <h1 style={{ fontSize: '2.5rem', color: '#333' }}>Upload Your Document</h1>
      <p style={{ color: '#555' }}>Accepted file types: <strong>PDF (.pdf), DOCX (.docx), Markdown (.md)</strong></p>

      <input 
        type="file" 
        onChange={handleFileChange} 
        style={{ margin: '20px 0' }} 
      />
      <button 
        onClick={handleUpload}
        disabled={uploading}
        style={{
          padding: '12px 25px',
          backgroundColor: uploading ? '#ccc' : '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {uploading && (
        <div style={{
          width: '300px',
          height: '10px',
          backgroundColor: '#e0e0e0',
          marginTop: '20px',
          borderRadius: '5px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#0070f3',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      )}

      {link && (
        <p style={{ marginTop: '20px', color: '#0070f3' }}>
          🎉 Your document is ready! View it here:{" "}
          <a href={link} target="_blank" rel="noopener noreferrer">
            {link}
          </a>
        </p>
      )}
    </div>
  );
}

form.parse(req, (err, fields, files) => {
    console.log("Received fields:", fields);
    console.log("Received files:", files);
  });