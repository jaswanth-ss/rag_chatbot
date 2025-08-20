import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import OpenAI from 'openai';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI client with error handling
let client;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error.message);
  process.exit(1);
}

app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://localhost:4200',
    'https://your-frontend-domain.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check (no dependencies required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'RAG Chat API is running',
    timestamp: new Date().toISOString()
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

let currentDocumentStore = null;
let currentTextContent = '';

// Initialize embeddings
let embeddings;
try {
  embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-large',
  });
} catch (error) {
  console.error('Failed to initialize embeddings:', error.message);
  embeddings = null;
}

app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const pdfPath = req.file.path;
    const loader = new PDFLoader(pdfPath);
    const docs = await loader.load();
    
    currentDocumentStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: process.env.QDRANT_COLLECTION_NAME || 'rag-chat',
    });

    fs.unlinkSync(pdfPath);

    res.json({ 
      message: 'PDF uploaded and processed successfully',
      pages: docs.length,
      filename: req.file.originalname
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

app.post('/api/process-text', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    currentTextContent = text;

    res.json({ 
      message: 'Text processed successfully',
      length: text.length
    });
  } catch (error) {
    console.error('Error processing text:', error);
    res.status(500).json({ error: 'Failed to process text' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    let context = '';
    
    if (currentDocumentStore) {
      const vectorSearcher = currentDocumentStore.asRetriever({ k: 3 });
      const relevantChunks = await vectorSearcher.invoke(message);
      context = relevantChunks.map(chunk => chunk.pageContent).join('\n\n');
    }
    
    if (currentTextContent) {
      context += (context ? '\n\n' : '') + 'Additional Text Content:\n' + currentTextContent;
    }

    if (!context) {
      return res.status(400).json({ error: 'No document or text content available. Please upload a PDF or enter text first.' });
    }

    const SYSTEM_PROMPT = `You are an AI assistant who helps answer user queries based on the provided context. Only answer based on the available context from the uploaded document or text. If the answer cannot be found in the context, politely say so. Context: ${context}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    res.json({ 
      response: response.choices[0].message.content,
      hasContext: !!context
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RAG Chat API is running' });
});

app.listen(port, () => {
  console.log(`RAG Chat API server running at http://localhost:${port}`);
});