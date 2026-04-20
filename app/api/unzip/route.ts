import JSZip from "jszip";

type OpenAIFileRef = {
  name: string;
  id: string;
  mime_type: string;
  download_link: string;
};

type UnzipRequestBody = {
  openaiFileIdRefs?: OpenAIFileRef[];
};

function isSafePath(path: string): boolean {
  if (!path) return false;
  if (path.includes("..")) return false;
  if (path.startsWith("/") || path.startsWith("\\")) return false;
  return true;
}

function isTextFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();

  return (
    lower.endsWith(".txt") ||
    lower.endsWith(".json") ||
    lower.endsWith(".xml") ||
    lower.endsWith(".sql") ||
    lower.endsWith(".md") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".js") ||
    lower.endsWith(".ts") ||
    lower.endsWith(".html") ||
    lower.endsWith(".css")
  );
}

function getMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".xml")) return "application/xml";
  if (lower.endsWith(".sql")) return "text/plain";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".md")) return "text/markdown";
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".js")) return "text/javascript";
  if (lower.endsWith(".ts")) return "text/plain";
  if (lower.endsWith(".html")) return "text/html";
  if (lower.endsWith(".css")) return "text/css";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  return "application/octet-stream";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UnzipRequestBody;
    const files = body.openaiFileIdRefs ?? [];

    if (files.length !== 1) {
      return Response.json(
        { error: "Exactly one uploaded ZIP file is required." },
        { status: 400 }
      );
    }

    const zipRef = files[0];

    const isZipByMime =
      zipRef.mime_type === "application/zip" ||
      zipRef.mime_type === "application/x-zip-compressed";

    const isZipByName = zipRef.name.toLowerCase().endsWith(".zip");

    if (!isZipByMime && !isZipByName) {
      return Response.json(
        { error: "Uploaded file must be a ZIP file." },
        { status: 400 }
      );
    }

    const downloadResponse = await fetch(zipRef.download_link);

    if (!downloadResponse.ok) {
      return Response.json(
        { error: "Failed to download uploaded ZIP file." },
        { status: 400 }
      );
    }

    const arrayBuffer = await downloadResponse.arrayBuffer();
    const zip = await JSZip.loadAsync(Buffer.from(arrayBuffer));

    const extractedManifest: Array<{
      path: string;
      size: number;
      isText: boolean;
    }> = [];

    const openaiFileResponse: Array<{
      name: string;
      mime_type: string;
      content: string;
    }> = [];

    const zipEntries = Object.keys(zip.files);

    for (const entryName of zipEntries) {
      const entry = zip.files[entryName];

      if (entry.dir) continue;

      if (!isSafePath(entry.name)) {
        return Response.json(
          { error: `Invalid file path in ZIP: ${entry.name}` },
          { status: 400 }
        );
      }

      const contentBuffer = await entry.async("nodebuffer");
      const isText = isTextFile(entry.name);

      extractedManifest.push({
        path: entry.name,
        size: contentBuffer.length,
        isText,
      });

      openaiFileResponse.push({
        name: entry.name,
        mime_type: getMimeType(entry.name),
        content: contentBuffer.toString("base64"),
      });

      if (openaiFileResponse.length > 40) {
        return Response.json(
          {
            error:
              "ZIP contains more than 40 files. Please upload a smaller ZIP or split it.",
          },
          { status: 400 }
        );
      }
    }

    return Response.json({
      zipName: zipRef.name,
      fileCount: extractedManifest.length,
      extracted: extractedManifest,
      openaiFileResponse,
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to unzip uploaded file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}