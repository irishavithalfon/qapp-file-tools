import JSZip from "jszip";

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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "A ZIP file is required." },
        { status: 400 }
      );
    }

    const isZipByType =
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed";

    const isZipByName = file.name.toLowerCase().endsWith(".zip");

    if (!isZipByType && !isZipByName) {
      return Response.json(
        { error: "Uploaded file must be a ZIP file." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(Buffer.from(arrayBuffer));

    const extracted: Array<{
      path: string;
      size: number;
      contentText?: string;
      contentBase64?: string;
      isText: boolean;
    }> = [];

    for (const entryName of Object.keys(zip.files)) {
      const entry = zip.files[entryName];

      if (entry.dir) continue;

      if (!isSafePath(entry.name)) {
        return Response.json(
          { error: `Invalid file path in ZIP: ${entry.name}` },
          { status: 400 }
        );
      }

      const contentBuffer = await entry.async("nodebuffer");
      const textFile = isTextFile(entry.name);

      extracted.push({
        path: entry.name,
        size: contentBuffer.length,
        isText: textFile,
        contentText: textFile ? contentBuffer.toString("utf-8") : undefined,
        contentBase64: textFile ? undefined : contentBuffer.toString("base64"),
      });
    }

    return Response.json({
      zipName: file.name,
      fileCount: extracted.length,
      extracted,
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