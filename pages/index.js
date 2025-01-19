export default function Home() {
  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Convert Your Document into a Website</h1>
      <p>Click below to test uploading a document.</p>
      <a href="/upload">
        <button style={{ padding: "10px 20px", fontSize: "18px", cursor: "pointer" }}>
          Go to Upload Page
        </button>
      </a>
    </div>
  );
}