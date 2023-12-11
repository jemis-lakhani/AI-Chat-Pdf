import axios from "axios";

const headers = {
  headers: {
    accept: "application/json",
    "content-type": "application/json",
    authorization: `Bearer ${process.env.COHERE_API_KEY}`,
  },
};

export async function getEmbeddingCohere(text: string) {
  const response = await axios.post(
    "https://api.cohere.ai/v1/embed",
    {
      texts: [text],
      truncate: "END",
    },
    headers
  );

  return (await response.data.embeddings[0]) as number[];
}
