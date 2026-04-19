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

    const zip = new JSZip();

    for (const fileRef of files) {
      const downloadResponse = await fetch(fileRef.download_link);

      if (!downloadResponse.ok) {
        return Response.json(
          { error: `Failed to download file: ${fileRef.name}` },
          { status: 400 }
        );
      }

      const arrayBuffer = await downloadResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (!isSafePath(fileRef.name)) {
        return Response.json(
          { error: `Invalid file name: ${fileRef.name}` },
          { status: 400 }
        );
      }

      zip.file(fileRef.name, buffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const outputFileName = body.zipFileName || "archive.zip";

    return Response.json({
      fileName: outputFileName,
      fileCount: files.length,
      openaiFileResponse: [
        {
          name: outputFileName,
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