import JSZip from "jszip";

type OpenAIFileRef = {
  name: string;
  id: string;
  mime_type: string;
  download_link: string;
};

type ZipRequestBody = {
  zipFileName?: string;
  openaiFileIdRefs?: OpenAIFileRef[];
};

function isSafePath(path: string): boolean {
  if (!path) return false;
  if (path.includes("..")) return false;
  if (path.startsWith("/") || path.startsWith("\\")) return false;
  return true;
}

function normalizeInputFileName(path: string): string {
  return path.replace(/^(\.\.[\/\\])+/, "").replace(/^[/\\]+/, "");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ZipRequestBody;
    const files = body.openaiFileIdRefs ?? [];

    if (files.length === 0) {
      return Response.json(
        { error: "At least one uploaded file is required." },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return Response.json(
        { error: "A maximum of 10 files can be zipped in one request." },
        { status: 400 }
      );
    }

    const zip = new JSZip();
    const usedNames = new Set<string>();

    for (const fileRef of files) {
      const downloadResponse = await fetch(fileRef.download_link);

      if (!downloadResponse.ok) {
        return Response.json(
          { error: `Failed to download file: ${fileRef.name}` },
          { status: 400 }
        );
      }

      const safeName = normalizeInputFileName(fileRef.name);

      if (!isSafePath(safeName)) {
        return Response.json(
          { error: `Invalid file name: ${fileRef.name}` },
          { status: 400 }
        );
      }

      if (usedNames.has(safeName)) {
        return Response.json(
          { error: `Duplicate file name detected: ${safeName}` },
          { status: 400 }
        );
      }

      usedNames.add(safeName);

      const arrayBuffer = await downloadResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      zip.file(safeName, buffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const outputFileName = body.zipFileName?.trim() || "archive.zip";
    const finalZipFileName = outputFileName.toLowerCase().endsWith(".zip")
      ? outputFileName
      : `${outputFileName}.zip`;

    return Response.json({
      fileName: finalZipFileName,
      fileCount: files.length,
      openaiFileResponse: [
        {
          name: finalZipFileName,
          mime_type: "application/zip",
          content: zipBuffer.toString("base64"),
        },
      ],
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to create zip",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}