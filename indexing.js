import 'dotenv/config';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';

async function init() {
  const pdfFilePath = './nodejs.pdf';
  const loader = new PDFLoader(pdfFilePath);

  const docs = await loader.load();

  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-large',
  });

  const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: process.env.QDRANT_COLLECTION_NAME || 'rag-chat',
  });
  

  console.log('Indexing of documents done...');
}

init();