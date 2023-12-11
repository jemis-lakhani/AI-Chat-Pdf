import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3intoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 404 });
  }
  try {
    const body = await req.json();
    const { file_key, file_name } = body;
    const document = await loadS3intoPinecone(file_key);
    if (document) {
      const chat_id = await db
        .insert(chats)
        .values({
          fileKey: file_key,
          pdfName: file_name,
          pdfUrl: getS3Url(file_key),
          userId,
        })
        .returning({
          insertedId: chats.id,
        });
      return NextResponse.json(
        {
          chat_id: chat_id[0].insertedId,
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      {
        error: "Something went wrong. Please try after some time.",
      },
      {
        status: 500,
      }
    );
  } catch (error) {
    console.log("Error", error);
    return NextResponse.json(
      {
        error: "internal server error",
      },
      {
        status: 500,
      }
    );
  }
}
