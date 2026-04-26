import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

export const runtime = "nodejs";

type UploadedFileRef = {
  id?: string;
  fileId?: string;
  name?: string;
};

type GeneratedFile = {
  name?: string;
  targetPath?: string;
  content?: string;
  base64?: string;
  encoding?: "utf8" | "base64";
};

type CreateZipRequest = {
  packageName?: string;
  openaiFileIdRefs?: UploadedFileRef[];
  generatedFiles?: GeneratedFile[];
  pathOverrides?: Record<string, string>;

  /**
   * REQUIRED.
   * Exact list of file paths that config.json references.
   * Must include config.json.
   */
  expectedPaths: string[];

  /**
   * Optional.
   * Defaults to "base64" because Custom Actions usually handle JSON better than binary.
   */
  returnMode?: "base64" | "binary";
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
    p.startsWith("../") ||
    p.includes("/../") ||
    p === ".." ||
    p.includes("//")
  ) {
    throw new Error(`Unsafe or invalid ZIP path: ${input}`);
  }

  return p;
}

function getUploadedFileId(ref: UploadedFileRef): string {
  const id = ref.id ?? ref.fileId;
  if (!id) {
    throw new Error(`Uploaded file reference is missing id/fileId: ${JSON.stringify(ref)}`);
  }
  return id;
}

function resolveUploadedTargetPath(
  ref: UploadedFileRef,
  pathOverrides: Record<string, string>
): string {
  const id = getUploadedFileId(ref);

  const byId = pathOverrides[id];
  const byName = ref.name ? pathOverrides[ref.name] : undefined;

  const targetPath = byId ?? byName;

  if (!targetPath) {
    throw new Error(
      `Missing explicit pathOverride for uploaded file id="${id}" name="${ref.name ?? ""}". ` +
      `Do not rely on uploaded filenames as ZIP paths.`
    );
  }

  return normalizeZipPath(targetPath);
}

function resolveGeneratedTargetPath(file: GeneratedFile): string {
  if (!file.targetPath) {
    throw new Error(
      `Generated file is missing targetPath. name="${file.name ?? ""}". ` +
      `Generated files must declare their exact archive path.`
    );
  }

  return normalizeZipPath(file.targetPath);
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

function decodeGeneratedFile(file: GeneratedFile): Buffer | string {
  if (file.base64) {
    return Buffer.from(file.base64, "base64");
  }

  if (file.encoding === "base64" && file.content) {
    return Buffer.from(file.content, "base64");
  }

  if (typeof file.content === "string") {
    return file.content;
  }

  throw new Error(`Generated file has no content/base64: ${file.targetPath ?? file.name ?? ""}`);
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

async function createZipFromUploadedFiles(req: NextRequest) {
  const body = (await req.json()) as CreateZipRequest;

  const zip = new JSZip();

  const pathOverrides = body.pathOverrides ?? {};
  const expectedPaths = body.expectedPaths ?? [];

  if (!Array.isArray(expectedPaths) || expectedPaths.length === 0) {
    throw new Error("expectedPaths is required and must contain the exact config.json file paths");
  }

  const writtenPaths = new Set<string>();

  function addFile(targetPathRaw: string, content: Buffer | string) {
    const targetPath = normalizeZipPath(targetPathRaw);

    if (writtenPaths.has(targetPath)) {
      throw new Error(`Duplicate archive path: ${targetPath}`);
    }

    zip.file(targetPath, content);
    writtenPaths.add(targetPath);
  }

  for (const generatedFile of body.generatedFiles ?? []) {
    const targetPath = resolveGeneratedTargetPath(generatedFile);
    const content = decodeGeneratedFile(generatedFile);
    addFile(targetPath, content);
  }

  for (const uploadedRef of body.openaiFileIdRefs ?? []) {
    const fileId = getUploadedFileId(uploadedRef);
    const targetPath = resolveUploadedTargetPath(uploadedRef, pathOverrides);
    const content = await fetchOpenAIFileContent(fileId);
    addFile(targetPath, content);
  }

  assertExactArchiveMatchesExpected([...writtenPaths], expectedPaths);

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9,
    },
  });

  const packageName = body.packageName?.endsWith(".qapp")
    ? body.packageName
    : `${body.packageName ?? "package"}.qapp`;

  if (body.returnMode === "binary") {
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${packageName}"`,
      },
    });
  }

  return NextResponse.json({
    fileName: packageName,
    mimeType: "application/octet-stream",
    base64: zipBuffer.toString("base64"),
    paths: [...writtenPaths].sort(),
  });
}

async function unzipUploadedZip(req: NextRequest) {
  const body = await req.json();

  const fileId = body.fileId ?? body.id;
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

    if (action === "createZipFromUploadedFiles") {
      return await createZipFromUploadedFiles(req);
    }

    if (action === "unzipUploadedZip") {
      return await unzipUploadedZip(req);
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 404 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 400 }
    );
  }
}