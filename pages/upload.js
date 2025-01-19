import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Upload() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const { token } = router.query;
    if (token === "secret123") {
      setAuthorized(true);
    } else {
      router.push("/");
    }
  }, [router.query]);

  if (!authorized) return <p>Redirecting...</p>;

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Upload Your Document</h1>
      <input type="file" />
      <button style={{ padding: "10px 20px", marginLeft: "10px" }}>
        Upload
      </button>
    </div>
  );
}