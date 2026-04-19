export default function PrivacyPage() {
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
          maxWidth: "900px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          lineHeight: 1.7,
        }}
      >
        <h1 style={{ marginTop: 0 }}>Privacy Policy</h1>
        <p>
          This service is used to extract ZIP files and create ZIP packages for
          Q-App generation workflows.
        </p>

        <h2>What data is processed</h2>
        <p>
          The service may process files uploaded by the user, including ZIP
          files and files contained within ZIP archives, in order to inspect,
          extract, validate, and package them.
        </p>

        <h2>How data is used</h2>
        <p>
          Uploaded files are used only for the requested file-processing
          operation, such as extraction, validation, inspection, and packaging.
        </p>

        <h2>Data retention</h2>
        <p>
          This service is intended to process files only for the duration needed
          to complete the requested operation. No permanent storage is intended
          unless explicitly stated by the application owner.
        </p>

        <h2>Sharing</h2>
        <p>
          Uploaded content is not intended to be shared with third parties,
          except as required to serve the requested operation through the hosting
          platform and related infrastructure.
        </p>

        <h2>Security</h2>
        <p>
          Reasonable steps are taken to limit file handling to the requested
          processing flow. However, users should avoid uploading sensitive data
          unless they are authorized to do so.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions about this privacy policy, please contact the
          application owner.
        </p>

        <p style={{ marginTop: "32px", color: "#6b7280" }}>
          Last updated: April 2026
        </p>
      </div>
    </main>
  );
}