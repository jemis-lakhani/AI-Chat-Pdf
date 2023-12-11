import { PineconeClient } from "@pinecone-database/pinecone";
import { getEmbeddingHuggingFace } from "./embedding-huggingface";
import { convertToAscii } from "./utils";

export async function getMatchesFromEmbeddings(
  embedding: number[],
  fileKey: string
) {
  // const pinecone = new Pinecone({
  //   environment: process.env.PINECONE_ENVIRONMENT!,
  //   apiKey: process.env.PINECONE_API_KEY!,
  // });
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT!,
    apiKey: process.env.PINECONE_API_KEY!,
  });

  const index = await pinecone.Index("chat-pdf");
  try {
    const namespace = convertToAscii(fileKey);
    const queryResult = await index.query({
      queryRequest: {
        topK: 5,
        includeMetadata: true,
        vector: embedding,
        namespace,
      },
    });
    return queryResult.matches || [];
  } catch (error) {
    console.log("Error while querying embeddings");
    throw error;
  }
}

export async function getContext(query: string, fileKey: string) {
  const queryEmbeddings = await getEmbeddingHuggingFace(query);

  const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);
  // console.log("Matches >>> ", matches);

  const qualifyingDocs = matches?.filter(
    (match) => match.score && match.score > 0.02
  );

  type MetaData = {
    text: string;
    pageNumber: string;
  };

  let docs = matches?.map((match) => (match.metadata as MetaData).text);
  console.log(">>> ", docs?.join("\n").substring(0, 3000));

  return docs?.join("\n").substring(0, 3000);
}
