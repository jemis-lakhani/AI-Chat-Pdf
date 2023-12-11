import {
  PineconeClient,
  utils as PineconeUtils,
} from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import {
  RecursiveCharacterTextSplitter,
  Document,
} from "@pinecone-database/doc-splitter";
import md5 from "md5";
import { getEmbeddingHuggingFace } from "./embedding-huggingface";
import { Vector } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import { convertToAscii } from "./utils";

let pinecone: PineconeClient | null = null;

export const getPineconeClient = async () => {
  if (!pinecone) {
    pinecone = new PineconeClient();
    await pinecone.init({
      environment: process.env.PINECONE_ENVIRONMENT!,
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pinecone;
};

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function loadS3intoPinecone(file_key: string) {
  // 1. Obtain the pdf => download from s3 and read it
  console.log("Download s3 file into file system >>>");
  const file_name = await downloadFromS3(file_key);
  if (!file_name) {
    throw new Error("Could not download from s3");
  }
  console.log("Downloaded s3 file into file system >>>");

  const loader = new PDFLoader(file_name);
  const pages = (await loader.load()) as PDFPage[];

  // 2. split and segment the pdf
  const documents = await Promise.all(pages.map(preapreDocument));
  console.log("Documnets prepared >>> ", documents.length);

  // 3. vectorise  and emded individual documents
  const vectors = await Promise.all(documents.flat().map(embedDocument));
  console.log("Vectors embeded >>> ", vectors.length);

  // 4. upload to pinecone
  const client = await getPineconeClient();
  const pineconeIndex = client.Index("chat-pdf");

  console.log("Inserting vectors into pinecone >>>");
  const namespace = convertToAscii(file_key);
  console.log("Vector namespace >>> ", namespace);

  PineconeUtils.chunkedUpsert(pineconeIndex, vectors, namespace, 10);
  // await pineconeIndex.upsert(vectors);

  return documents[0];
}

async function preapreDocument(page: PDFPage) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, "");
  // split the docs
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 1000),
      },
    }),
  ]);
  return docs;
}

export async function embedDocument(doc: Document) {
  try {
    const embeddings = await getEmbeddingHuggingFace(doc.pageContent);

    const hash = md5(doc.pageContent);
    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as Vector;
  } catch (error) {
    console.error("Error while embedding the document,", error);
    throw error;
  }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};
