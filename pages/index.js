import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

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
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      padding: '40px'
    }}>
      <h1 style={{ fontSize: '2.5rem', color: '#333' }}>Upload Your Document</h1>
      <p style={{ fontSize: '1.2rem', color: '#555' }}>Supported file types: PDF, DOCX</p>

      <form onSubmit={handleUpload} encType="multipart/form-data" style={{ textAlign: 'center' }}>
        <input type="file" onChange={handleFileChange} required />
        <button type="submit" style={{
          padding: '10px 20px',
          marginLeft: '10px',
          backgroundColor: '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

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