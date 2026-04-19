import JSZip from "jszip";

type OpenAIFileRef = {
  name: string;
  id: string;
  mime_type: string;
  download_link: string;
};

type GeneratedFile = {
  path: string;
  contentBase64: string;
};

type ZipRequestBody = {
  zipFileName?: string;
  openaiFileIdRefs?: OpenAIFileRef[];
  generatedFiles?: GeneratedFile[];
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

    const uploadedFiles = body.openaiFileIdRefs ?? [];
    const generatedFiles = body.generatedFiles ?? [];

    if (uploadedFiles.length === 0 && generatedFiles.length === 0) {
      return Response.json(
        { error: "At least one uploaded file or generated file is required." },
        { status: 400 }
      );
    }

    const totalFiles = uploadedFiles.length + generatedFiles.length;

    if (totalFiles > 50) {
      return Response.json(
        { error: "A maximum of 50 files can be zipped in one request." },
        { status: 400 }
      );
    }

    const zip = new JSZip();
    const usedPaths = new Set<string>();

    for (const fileRef of uploadedFiles) {
      const safeName = normalizeInputFileName(fileRef.name);

      if (!isSafePath(safeName)) {
        return Response.json(
          { error: `Invalid uploaded file name: ${fileRef.name}` },
          { status: 400 }
        );
      }

      if (usedPaths.has(safeName)) {
        return Response.json(
          { error: `Duplicate file path detected: ${safeName}` },
          { status: 400 }
        );
      }

      const downloadResponse = await fetch(fileRef.download_link);

      if (!downloadResponse.ok) {
        return Response.json(
          { error: `Failed to download uploaded file: ${fileRef.name}` },
          { status: 400 }
        );
      }

      const arrayBuffer = await downloadResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      zip.file(safeName, buffer);
      usedPaths.add(safeName);
    }

    for (const generatedFile of generatedFiles) {
      const safePath = normalizeInputFileName(generatedFile.path);

      if (!isSafePath(safePath)) {
        return Response.json(
          { error: `Invalid generated file path: ${generatedFile.path}` },
          { status: 400 }
        );
      }

      if (!generatedFile.contentBase64) {
        return Response.json(
          { error: `Missing content for generated file: ${generatedFile.path}` },
          { status: 400 }
        );
      }

      if (usedPaths.has(safePath)) {
        return Response.json(
          { error: `Duplicate file path detected: ${safePath}` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(generatedFile.contentBase64, "base64");
      zip.file(safePath, buffer);
      usedPaths.add(safePath);
    }

    const outputFileName = body.zipFileName?.trim() || "archive.zip";
    const finalZipFileName = outputFileName.toLowerCase().endsWith(".zip")
      ? outputFileName
      : `${outputFileName}.zip`;

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return Response.json({
      fileName: finalZipFileName,
      fileCount: totalFiles,
      includedPaths: Array.from(usedPaths),
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