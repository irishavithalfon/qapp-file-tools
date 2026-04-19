"use client";

import { useMemo, useState } from "react";

type ExtractedFile = {
  path: string;
  size: number;
  contentText?: string;
  contentBase64?: string;
  isText: boolean;
};

type UnzipResult = {
  zipName?: string;
  fileCount?: number;
  extracted?: ExtractedFile[];
  error?: string;
  details?: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UnzipResult | null>(null);
  const [rawResult, setRawResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string>("");

  const fileDescription = useMemo(() => {
    if (!file) return "No ZIP file selected yet.";
    return `${file.name} (${formatBytes(file.size)})`;
  }, [file]);

  const selectedExtractedFile =
    result?.extracted?.find((item) => item.path === selectedFilePath) ?? null;

  async function handleUpload() {
    if (!file) {
      setRawResult("Please select a ZIP file first.");
      setResult(null);
      setSelectedFilePath("");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setRawResult("");
    setSelectedFilePath("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/unzip-local", {
        method: "POST",
        body: formData,
      });

      const data: UnzipResult = await response.json();

      setRawResult(JSON.stringify(data, null, 2));

      if (!response.ok) {
        setResult(null);
        return;
      }

      setResult(data);

      if (data.extracted && data.extracted.length > 0) {
        setSelectedFilePath(data.extracted[0].path);
      }
    } catch (error) {
      setResult(null);
      setRawResult(`Upload error: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setFile(null);
    setResult(null);
    setRawResult("");
    setSelectedFilePath("");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f7f7f8",
        padding: "32px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: "8px" }}>ZIP Upload Test</h1>
        <p style={{ marginTop: 0, color: "#555", marginBottom: "24px" }}>
          Select a ZIP file, upload it, and inspect the extracted files.
        </p>

        <div
          style={{
            border: "2px dashed #cfcfd4",
            borderRadius: "12px",
            padding: "20px",
            backgroundColor: "#fafafa",
            marginBottom: "16px",
          }}
        >
          <label
            htmlFor="zipFile"
            style={{
              display: "inline-block",
              padding: "10px 16px",
              backgroundColor: "#111827",
              color: "#ffffff",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            Choose ZIP File
          </label>

          <input
            id="zipFile"
            type="file"
            accept=".zip"
            style={{ display: "none" }}
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setFile(selected);
              setResult(null);
              setRawResult("");
              setSelectedFilePath("");
            }}
          />

          <div style={{ color: "#333" }}>
            <strong>Selected file:</strong> {fileDescription}
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <button
            onClick={handleUpload}
            disabled={isLoading}
            style={{
              padding: "12px 18px",
              border: "none",
              borderRadius: "10px",
              backgroundColor: isLoading ? "#9ca3af" : "#2563eb",
              color: "#fff",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {isLoading ? "Uploading..." : "Upload and Unzip"}
          </button>

          <button
            onClick={handleClear}
            disabled={isLoading}
            style={{
              padding: "12px 18px",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              backgroundColor: "#fff",
              color: "#111827",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            Clear
          </button>
        </div>

        {result && (
          <section
            style={{
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Result</h2>
            <p>
              <strong>ZIP name:</strong> {result.zipName}
            </p>
            <p>
              <strong>Files found:</strong> {result.fileCount ?? 0}
            </p>

            {result.extracted && result.extracted.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "320px 1fr",
                  gap: "16px",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    overflow: "hidden",
                    backgroundColor: "#fff",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid #e5e7eb",
                      fontWeight: 700,
                      backgroundColor: "#f3f4f6",
                    }}
                  >
                    Extracted Files
                  </div>

                  <div style={{ maxHeight: "420px", overflowY: "auto" }}>
                    {result.extracted.map((item) => {
                      const isSelected = item.path === selectedFilePath;

                      return (
                        <button
                          key={item.path}
                          onClick={() => setSelectedFilePath(item.path)}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            padding: "12px 14px",
                            border: "none",
                            borderBottom: "1px solid #f0f0f0",
                            backgroundColor: isSelected ? "#dbeafe" : "#fff",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#111827",
                              wordBreak: "break-word",
                            }}
                          >
                            {item.path}
                          </div>
                          <div
                            style={{
                              marginTop: "4px",
                              color: "#6b7280",
                              fontSize: "14px",
                            }}
                          >
                            {formatBytes(item.size)} ·{" "}
                            {item.isText ? "Text file" : "Binary file"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    backgroundColor: "#fff",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid #e5e7eb",
                      fontWeight: 700,
                      backgroundColor: "#f3f4f6",
                    }}
                  >
                    File Preview
                  </div>

                  <div style={{ padding: "14px" }}>
                    {!selectedExtractedFile && <div>No file selected.</div>}

                    {selectedExtractedFile && (
                      <>
                        <div style={{ marginBottom: "12px" }}>
                          <div>
                            <strong>Path:</strong> {selectedExtractedFile.path}
                          </div>
                          <div>
                            <strong>Size:</strong>{" "}
                            {formatBytes(selectedExtractedFile.size)}
                          </div>
                          <div>
                            <strong>Type:</strong>{" "}
                            {selectedExtractedFile.isText ? "Text" : "Binary"}
                          </div>
                        </div>

                        {selectedExtractedFile.isText ? (
                          <pre
                            style={{
                              backgroundColor: "#111827",
                              color: "#f9fafb",
                              padding: "16px",
                              borderRadius: "12px",
                              whiteSpace: "pre-wrap",
                              overflowX: "auto",
                              maxHeight: "500px",
                              overflowY: "auto",
                            }}
                          >
                            {selectedExtractedFile.contentText || ""}
                          </pre>
                        ) : (
                          <div
                            style={{
                              backgroundColor: "#fff7ed",
                              color: "#9a3412",
                              padding: "14px",
                              borderRadius: "10px",
                              border: "1px solid #fed7aa",
                            }}
                          >
                            This file is binary, so a text preview is not shown.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        <section>
          <h2>Raw Response</h2>
          <pre
            style={{
              backgroundColor: "#111827",
              color: "#f9fafb",
              padding: "16px",
              borderRadius: "12px",
              whiteSpace: "pre-wrap",
              overflowX: "auto",
            }}
          >
            {rawResult || "No response yet."}
          </pre>
        </section>
      </div>
    </main>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}