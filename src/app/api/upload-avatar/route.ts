import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, filename, dataUrl } = body as {
      userId: string;
      filename: string;
      dataUrl: string;
    };

    if (!userId || !dataUrl) {
      return NextResponse.json(
        { message: "Missing parameters" },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });

    // Derive extension from dataUrl (data:image/png;base64,....)
    const matches = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ message: "Invalid dataUrl" }, { status: 400 });
    }
    const mime = matches[1];
    const base64 = matches[2];
    const ext = mime.split("/")[1];

    const safeFilename = filename
      ? filename.replace(/[^a-zA-Z0-9._-]/g, "_")
      : `${userId}-${Date.now()}.${ext}`;

    const outPath = path.join(uploadsDir, safeFilename);
    const buffer = Buffer.from(base64, "base64");
    await fs.promises.writeFile(outPath, buffer);
    console.log(
      `upload-avatar: saved ${safeFilename} (${buffer.length} bytes)`
    );

    const publicUrl = `/uploads/${safeFilename}`;
    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error("upload-avatar error:", err);
    return NextResponse.json(
      { message: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
