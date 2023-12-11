import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { HfInference } from "@huggingface/inference";
import { HuggingFaceStream, Message, StreamingTextResponse } from "ai";
import { experimental_buildStarChatBetaPrompt } from "ai/prompts";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Create a new HuggingFace Inference instance
const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Set the runtime to edge
// export const runtime = "edge";

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages, chatId } = await req.json();
  const lastMessage = messages[messages.length - 1];
  console.log("Last message >>> ", lastMessage);

  const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
  if (_chats.length != 1) {
    return NextResponse.json({ error: "chat not found", status: 404 });
  }
  const context = await getContext(lastMessage.content, _chats[0].fileKey);
  // console.log("Context >>>" + context);
  // return;

  const prompt = {
    role: "system",
    content: `${context}
  `,
  };
  const response = await Hf.textGenerationStream({
    model: "HuggingFaceH4/starchat-beta",
    inputs: experimental_buildStarChatBetaPrompt([
      prompt,
      ...messages.filter((message: Message) => message.role === "user"),
    ]),
    parameters: {
      max_new_tokens: 200,
      // @ts-ignore (this is a valid parameter specifically in OpenAssistant models)
      typical_p: 0.2,
      repetition_penalty: 1,
      truncate: 1000,
      return_full_text: false,
    },
  });

  // console.log("Response >> ", response);

  // Convert the response into a friendly text-stream
  const stream = HuggingFaceStream(response);
  console.log(stream);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
