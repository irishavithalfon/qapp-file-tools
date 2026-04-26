import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

export const runtime = "nodejs";

type UploadedFileRef = {
  id?: string;
  fileId?: string;
};

type UploadedFileWithTarget = {
  fileId: string;
  targetPath: string;
};

type GeneratedFile = {
  name?: string;
  path?: string;
  contentBase64?: string;
  targetPath?: string;
  content?: string;
  base64?: string;
  encoding?: "utf8" | "base64";
};

type CreateZipRequest = {
  zipFileName?: string;
  packageName?: string;

  // Legacy shape. Kept for backward compatibility.
  openaiFileIdRefs?: Array<string | UploadedFileRef>;
  // Preferred shape. Explicitly binds each uploaded file to its target path.
  uploadedFiles?: UploadedFileWithTarget[];
  generatedFiles?: GeneratedFile[];
  // Legacy mapping for openaiFileIdRefs only. Keys must be file IDs.
  pathOverrides?: Record<string, string>;

  // REQUIRED: exact list of paths that must exist in the archive.
  expectedPaths: string[];

  // Optional: defaults to base64 (better for JSON-based Action responses).
  returnMode?: "base64" | "binary";
};

type ResolvedUploadedFile = {
  fileId: string;
  targetPath: string;
};

function normalizeZipPath(input: string): string {
  if (!input || typeof input !== "string") {
    throw new Error("Invalid empty ZIP path");
  }

  let p = input.replace(/\\/g, "/").trim();

  while (p.startsWith("/")) p = p.slice(1);

  if (
    !p ||
    p.includes("\0") ||
    p === "." ||
    p.startsWith("./") ||
    p.includes("/./") ||
    p === ".." ||
    p.startsWith("../") ||
    p.includes("/../") ||
    p.endsWith("/") ||
    p.includes("//")
  ) {
    throw new Error(`Unsafe or invalid ZIP path: ${input}`);
  }

  return p;
}

function getUploadedFileId(ref: string | UploadedFileRef): string {
  if (typeof ref === "string") {
    const id = ref.trim();
    if (!id) {
      throw new Error("Uploaded file ID cannot be empty");
    }
    return id;
  }

  const id = ref.id ?? ref.fileId;
  if (!id || !id.trim()) {
    throw new Error(`Uploaded file reference is missing id/fileId: ${JSON.stringify(ref)}`);
  }

  return id.trim();
}

function resolveGeneratedTargetPath(file: GeneratedFile): string {
  const targetPath = file.path ?? file.targetPath;

  if (!targetPath) {
    throw new Error(
      `Generated file is missing path. name="${file.name ?? ""}". ` +
        "Generated files must declare their exact archive path."
    );
  }

  return normalizeZipPath(targetPath);
}

function decodeGeneratedFile(file: GeneratedFile): Buffer | string {
  if (file.contentBase64) {
    return Buffer.from(file.contentBase64, "base64");
  }

  if (file.base64) {
    return Buffer.from(file.base64, "base64");
  }

  if (file.encoding === "base64" && file.content) {
    return Buffer.from(file.content, "base64");
  }

  if (typeof file.content === "string") {
    return file.content;
  }

  throw new Error(
    `Generated file has no contentBase64/content/base64: ${file.path ?? file.targetPath ?? file.name ?? ""}`
  );
}

function assertExactArchiveMatchesExpected(
  actualPaths: string[],
  expectedPathsRaw: string[]
): void {
  const actual = new Set(actualPaths.map(normalizeZipPath));
  const expected = new Set(expectedPathsRaw.map(normalizeZipPath));

  const missing = [...expected].filter((p) => !actual.has(p));
  const extra = [...actual].filter((p) => !expected.has(p));

  if (missing.length || extra.length) {
    throw new Error(
      [
        "ZIP contents do not exactly match config.json paths.",
        missing.length ? `Missing paths: ${missing.join(", ")}` : "",
        extra.length ? `Extra paths: ${extra.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join(" ")
    );
  }
}

function resolveUploadedFiles(body: CreateZipRequest): ResolvedUploadedFile[] {
  const uploadedFiles = body.uploadedFiles ?? [];
  const openaiRefs = body.openaiFileIdRefs ?? [];
  const pathOverrides = body.pathOverrides ?? {};

  if (uploadedFiles.length > 0 && openaiRefs.length > 0) {
    throw new Error(
      "Use either uploadedFiles or openaiFileIdRefs. Do not send both in one request."
    );
  }

  if (uploadedFiles.length > 0) {
    return uploadedFiles.map((item) => ({
      fileId: getUploadedFileId(item.fileId),
      targetPath: normalizeZipPath(item.targetPath),
    }));
  }

  const resolvedFromLegacy = openaiRefs.map((ref) => {
    const fileId = getUploadedFileId(ref);
    const targetPathRaw = pathOverrides[fileId];

    if (!targetPathRaw) {
      throw new Error(
        `Missing explicit pathOverride for uploaded file ID: ${fileId}. ` +
          "Do not rely on file names or implicit archive paths."
      );
    }

    return {
      fileId,
      targetPath: normalizeZipPath(targetPathRaw),
    };
  });

  const refIdSet = new Set(resolvedFromLegacy.map((item) => item.fileId));

  for (const overrideKey of Object.keys(pathOverrides)) {
    if (!refIdSet.has(overrideKey)) {
      throw new Error(
        `pathOverrides contains key "${overrideKey}" that is not a file ID in openaiFileIdRefs.`
      );
    }
  }

  return resolvedFromLegacy;
}

async function fetchOpenAIFileContent(fileId: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch(`https://api.openai.com/v1/files/${fileId}/content`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch OpenAI file ${fileId}: ${response.status} ${text}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function createZipFromUploadedFiles(req: NextRequest) {
  const body = (await req.json()) as CreateZipRequest;

  const expectedPaths = body.expectedPaths ?? [];
  const generatedFiles = body.generatedFiles ?? [];
  const uploadedFiles = resolveUploadedFiles(body);

  if (generatedFiles.length === 0 && uploadedFiles.length === 0) {
    throw new Error(
      "At least one uploaded file or generated file is required. Send generatedFiles and/or uploadedFiles."
    );
  }

  if (!Array.isArray(expectedPaths) || expectedPaths.length === 0) {
    throw new Error("expectedPaths is required and must contain the exact config.json file paths");
  }

  const normalizedExpected = expectedPaths.map(normalizeZipPath);

  if (!normalizedExpected.includes("config.json")) {
    throw new Error("expectedPaths must include config.json at root");
  }

  const zip = new JSZip();
  const writtenPaths = new Set<string>();

  function addFile(targetPathRaw: string, content: Buffer | string) {
    const targetPath = normalizeZipPath(targetPathRaw);

    if (writtenPaths.has(targetPath)) {
      throw new Error(`Duplicate archive path: ${targetPath}`);
    }

    zip.file(targetPath, content);
    writtenPaths.add(targetPath);
  }

  for (const generatedFile of generatedFiles) {
    const targetPath = resolveGeneratedTargetPath(generatedFile);
    const content = decodeGeneratedFile(generatedFile);
    addFile(targetPath, content);
  }

  for (const uploadedFile of uploadedFiles) {
    const content = await fetchOpenAIFileContent(uploadedFile.fileId);
    addFile(uploadedFile.targetPath, content);
  }

  assertExactArchiveMatchesExpected([...writtenPaths], normalizedExpected);

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9,
    },
  });

  const requestedName = body.zipFileName ?? body.packageName ?? "package.qapp";
  const packageName =
    requestedName.endsWith(".qapp") || requestedName.endsWith(".zip")
      ? requestedName
      : `${requestedName}.qapp`;

  if (body.returnMode === "binary") {
    // NextResponse in Next 16 expects BodyInit-compatible payload.
    const binaryBody = new Uint8Array(zipBuffer);

    return new NextResponse(binaryBody, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${packageName}"`,
      },
    });
  }

  return NextResponse.json({
    fileName: packageName,
    fileCount: writtenPaths.size,
    mimeType: "application/octet-stream",
    base64: zipBuffer.toString("base64"),
    includedPaths: [...writtenPaths].sort(),
  });
}

async function unzipUploadedZip(req: NextRequest) {
  const body = await req.json();

  const rawRef = body.openaiFileIdRefs?.[0];
  const fileId =
    body.fileId ??
    body.id ??
    (typeof rawRef === "string" ? rawRef : rawRef?.id ?? rawRef?.fileId);

  if (!fileId) {
    throw new Error("fileId is required");
  }

  const zipBuffer = await fetchOpenAIFileContent(fileId);
  const zip = await JSZip.loadAsync(zipBuffer);

  const files: Record<string, string> = {};

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    files[path] = await entry.async("string");
  }

  return NextResponse.json({
    files,
    paths: Object.keys(files).sort(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.pathname.split("/").filter(Boolean).pop();

    if (action === "zip" || action === "createZipFromUploadedFiles") {
      return await createZipFromUploadedFiles(req);
    }

    if (action === "unzip" || action === "unzipUploadedZip") {
      return await unzipUploadedZip(req);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 404 });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 400 }
    );
  }
}
