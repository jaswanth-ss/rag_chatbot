# RAG Chat Application

A full-stack application that allows users to upload PDF documents or enter text, then chat with an AI assistant about the content using Retrieval-Augmented Generation (RAG).

## Features

- **PDF Upload**: Drag and drop or click to upload PDF files
- **Text Input**: Enter text directly in a text area
- **AI Chat**: Ask questions about uploaded content and get AI responses
- **Modern UI**: Responsive design with gradient backgrounds and smooth animations
- **Real-time Chat**: Live chat interface with typing indicators

## Architecture

### Frontend (Angular 19)
- Modern Angular application with standalone components
- Responsive design with CSS gradients and animations
- File upload with drag-and-drop support
- Real-time chat interface
- HTTP client for API communication

### Backend (Node.js + Express)
- Express server with CORS support
- Multer for file upload handling
- LangChain integration for document processing
- OpenAI embeddings and GPT-4 for chat responses
- Qdrant vector database for document storage

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Angular CLI** (v19)
3. **Qdrant** vector database running on localhost:6333
4. **OpenAI API key**

## Setup Instructions

### 1. Environment Configuration
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Start Qdrant Database
Make sure Qdrant is running on localhost:6333. You can use Docker:
```bash
docker run -p 6333:6333 qdrant/qdrant
```

### 4. Start the Backend Server
```bash
npm start
```
The backend API will be available at http://localhost:3000

### 5. Start the Frontend Application
```bash
cd frontend
ng serve
```
The frontend will be available at http://localhost:4200

## Usage

1. **Upload Content**:
   - Upload a PDF file using the drag-and-drop area or file browser
   - OR enter text directly in the text area
   - Click "Process PDF" or "Process Text" to index the content

2. **Chat with AI**:
   - Once content is processed, the chat interface becomes active
   - Type questions about your document or text
   - Press Enter or click the send button to get AI responses
   - The AI will only answer based on the uploaded/entered content

## API Endpoints

- `POST /api/upload-pdf` - Upload and process PDF files
- `POST /api/process-text` - Process text content
- `POST /api/chat` - Send chat messages and get AI responses
- `GET /api/health` - Health check endpoint

## Technology Stack

### Frontend
- Angular 19
- TypeScript
- CSS3 with modern styling
- RxJS for reactive programming

### Backend
- Node.js
- Express.js
- LangChain
- OpenAI API
- Qdrant Vector Database
- Multer for file uploads

## Development

### Frontend Development
```bash
cd frontend
ng serve --open
```

### Backend Development
```bash
npm run dev
```

## File Structure

```
├── frontend/                 # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.html
│   │   │   ├── app.component.ts
│   │   │   ├── app.component.css
│   │   │   └── app.config.ts
│   │   └── ...
├── server.js                 # Express server
├── chat.js                   # Original chat functionality
├── indexing.js              # Original indexing functionality
├── package.json             # Backend dependencies
└── README.md               # This file
```

## Notes

- Make sure your OpenAI API key has sufficient credits
- Qdrant must be running before starting the backend
- The application uses GPT-4 for chat responses
- PDF processing may take a few seconds depending on file size
- Large documents are automatically chunked for better retrieval
