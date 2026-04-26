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