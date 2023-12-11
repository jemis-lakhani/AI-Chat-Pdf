import axios from "axios";

const headers = {
  headers: {
    authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
    accept: "application/json",
    "content-type": "application/json",
  },
};

export async function getEmbeddingHuggingFace(text: string) {
  const response = await axios.post(
    "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
    {
      inputs: [text],
      options: { wait_for_model: true },
    },
    headers
  );

  return (await response.data[0]) as number[];
}
