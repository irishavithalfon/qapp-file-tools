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

function normalizeRelativePath(path: string): string {
  return path.replace(/^(\.\.[\/\\])+/, "").replace(/^[/\\]+/, "");
}

function ensureQappExtension(fileName: string): string {
  const trimmed = fileName.trim();

  if (!trimmed) return "package.qapp";
  if (trimmed.toLowerCase().endsWith(".qapp")) return trimmed;
  if (trimmed.toLowerCase().endsWith(".zip")) {
    return trimmed.slice(0, -4) + ".qapp";
  }

  return `${trimmed}.qapp`;
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

    if (totalFiles > 100) {
      return Response.json(
        { error: "A maximum of 100 files can be zipped in one request." },
        { status: 400 }
      );
    }

    const zip = new JSZip();
    const usedPaths = new Set<string>();

    for (const fileRef of uploadedFiles) {
      const relativePath = normalizeRelativePath(fileRef.name);

      if (!isSafePath(relativePath)) {
        return Response.json(
          { error: `Invalid uploaded file path: ${fileRef.name}` },
          { status: 400 }
        );
      }

      if (usedPaths.has(relativePath)) {
        return Response.json(
          { error: `Duplicate file path detected: ${relativePath}` },
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

      zip.file(relativePath, buffer);
      usedPaths.add(relativePath);
    }

    for (const generatedFile of generatedFiles) {
      const relativePath = normalizeRelativePath(generatedFile.path);

      if (!isSafePath(relativePath)) {
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

      if (usedPaths.has(relativePath)) {
        return Response.json(
          { error: `Duplicate file path detected: ${relativePath}` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(generatedFile.contentBase64, "base64");
      zip.file(relativePath, buffer);
      usedPaths.add(relativePath);
    }

    if (!usedPaths.has("config.json")) {
      return Response.json(
        {
          error:
            "The final Q-App package must include config.json at the root level.",
        },
        { status: 400 }
      );
    }

    const finalFileName = ensureQappExtension(body.zipFileName || "package.qapp");
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return Response.json({
      fileName: finalFileName,
      fileCount: totalFiles,
      includedPaths: Array.from(usedPaths),
      openaiFileResponse: [
        {
          name: finalFileName,
          mime_type: "application/zip",
          content: zipBuffer.toString("base64"),
        },
      ],
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to create Q-App package",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}