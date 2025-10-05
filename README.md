# KnowledgeScout - Document Q&A System

A hackathon project that allows users to upload documents and ask questions with AI-powered answers using Google Gemini API.

## 🚀 Features

- **Document Upload**: Support for PDF, Word, text files, and images
- **AI-Powered Q&A**: Ask natural language questions about your documents
- **Source Citations**: Get answers with page references and source citations
- **Private Documents**: Keep documents private or share with tokens
- **Real-time Processing**: Process documents with Google Gemini API
- **Query Caching**: 60-second cache for improved performance
- **Rate Limiting**: 60 requests per minute per user
- **Pagination**: Efficient document listing with pagination

## 🛠 Tech Stack

### Backend

- **Node.js** with Express.js and TypeScript
- **PostgreSQL** with Prisma ORM
- **Google Gemini API** for AI processing
- **JWT Authentication**
- **Multer** for file uploads
- **Rate limiting** and **idempotency** support

### Frontend

- **Next.js 14** with App Router
- **React** with TypeScript
- **Tailwind CSS** for styling
- **React Query** for API state management
- **React Hook Form** for form handling

## 📋 API Documentation

### Authentication Endpoints

#### POST /api/auth/register

Register a new user.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token"
}
```

#### POST /api/auth/login

Login with existing credentials.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token"
}
```

### Document Endpoints

#### POST /api/docs

Upload a new document (multipart form data).

**Headers:**

- `Authorization: Bearer <token>`
- `Idempotency-Key: <optional_key>` (for idempotent requests)

**Form Data:**

- `document`: File (PDF, DOC, DOCX, TXT, JPG, PNG)
- `isPrivate`: boolean (default: true)

**Response:**

```json
{
  "id": "doc_id",
  "filename": "generated_filename",
  "originalName": "original_filename.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000,
  "uploadDate": "2024-01-01T00:00:00.000Z",
  "isPrivate": true,
  "shareToken": "share_token_or_null"
}
```

#### GET /api/docs?limit=10&offset=0

List user's documents with pagination.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```json
{
  "items": [
    {
      "id": "doc_id",
      "originalName": "document.pdf",
      "fileType": "application/pdf",
      "fileSize": 1024000,
      "uploadDate": "2024-01-01T00:00:00.000Z",
      "isPrivate": true,
      "shareToken": "share_token_or_null",
      "processedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "next_offset": 10,
  "total": 25
}
```

#### GET /api/docs/:id

Get specific document details.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```json
{
  "id": "doc_id",
  "originalName": "document.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000,
  "uploadDate": "2024-01-01T00:00:00.000Z",
  "isPrivate": true,
  "shareToken": "share_token_or_null",
  "processedAt": "2024-01-01T00:00:00.000Z",
  "content": "extracted_text_content"
}
```

#### GET /api/docs/shared/:token

Access shared document without authentication.

**Response:**

```json
{
  "id": "doc_id",
  "originalName": "document.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000,
  "uploadDate": "2024-01-01T00:00:00.000Z",
  "isPrivate": false,
  "shareToken": "share_token",
  "processedAt": "2024-01-01T00:00:00.000Z",
  "content": "extracted_text_content"
}
```

### Q&A Endpoints

#### POST /api/ask

Ask a question about a document.

**Headers:**

- `Authorization: Bearer <token>`
- `Idempotency-Key: <optional_key>` (for idempotent requests)

**Request:**

```json
{
  "query": "What is the main topic of this document?",
  "documentId": "doc_id",
  "k": 3
}
```

**Response:**

```json
{
  "answer": "The main topic is artificial intelligence and machine learning...",
  "sources": ["[Page 1]", "[Section 2.1]", "[Page 5]"],
  "cached": false,
  "cachedUntil": "2024-01-01T00:01:00.000Z"
}
```

### Admin Endpoints

#### POST /api/index/rebuild

Process all unprocessed documents.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```json
{
  "message": "Document processing completed",
  "results": [
    {
      "documentId": "doc_id",
      "status": "success",
      "message": "Document processed successfully"
    }
  ],
  "processed": 5,
  "failed": 0
}
```

#### GET /api/index/stats

Get system statistics.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```json
{
  "documents": {
    "total": 25,
    "processed": 20,
    "unprocessed": 5,
    "processingRate": "80.00"
  },
  "queries": {
    "total": 150,
    "recent": [
      {
        "query": "What is the main topic?",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "document": {
          "originalName": "document.pdf"
        }
      }
    ]
  },
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Gemini API key

### Backend Setup

1. **Install dependencies:**

```bash
cd server
npm install
```

2. **Environment setup:**

```bash
cp env.example .env
```

3. **Configure environment variables:**

```env
DATABASE_URL="postgresql://username:password@localhost:5432/knowledgescout"
JWT_SECRET="your-super-secret-jwt-key-here"
GEMINI_API_KEY="your-gemini-api-key-here"
PORT=3001
NODE_ENV="development"
```

4. **Setup database:**

```bash
npx prisma generate
npx prisma db push
```

5. **Start server:**

```bash
npm run dev
```

### Frontend Setup

1. **Install dependencies:**

```bash
cd client
npm install
```

2. **Environment setup:**

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
```

3. **Start development server:**

```bash
npm run dev
```

### Full Stack Development

From the root directory:

```bash
npm install
npm run dev
```

This will start both the backend (port 3001) and frontend (port 3000) concurrently.

## 🧪 Test User Credentials

For testing purposes, you can register new users through the `/register` endpoint or use these test credentials:

**Test User 1:**

- Email: `test@example.com`
- Password: `password123`

**Test User 2:**

- Email: `demo@example.com`
- Password: `demo123`

## 📊 Seed Data

The application starts with no data. To test the system:

1. Register a new user
2. Upload documents through the `/docs` page
3. Process documents using the admin panel
4. Ask questions through the `/ask` page

## 🔒 Security Features

- **Rate Limiting**: 60 requests per minute per user
- **JWT Authentication**: Secure token-based authentication
- **File Validation**: Only allowed file types can be uploaded
- **Private Documents**: Documents are private by default
- **Share Tokens**: Optional sharing with unique tokens
- **Input Validation**: All inputs are validated and sanitized

## 🚦 Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "field": "field_name" // Optional, for validation errors
  }
}
```

**Common Error Codes:**

- `RATE_LIMIT`: Rate limit exceeded (429)
- `UNAUTHORIZED`: Authentication required (401)
- `NOT_FOUND`: Resource not found (404)
- `VALIDATION_ERROR`: Input validation failed (400)
- `FIELD_REQUIRED`: Required field missing (400)
- `INTERNAL_ERROR`: Server error (500)

## 🌐 CORS Configuration

CORS is configured to allow requests from `http://localhost:3000` during development. For production, update the CORS configuration in `server/src/index.ts`.

## 📱 Pages

- **`/`** - Landing page with authentication
- **`/docs`** - Document management (upload, list, process)
- **`/ask`** - Q&A interface for asking questions
- **`/admin`** - Admin panel for system statistics and document processing
- **`/login`** - User login
- **`/register`** - User registration

## 🎯 Key Features Implemented

✅ **Document Upload**: Multipart file upload with validation  
✅ **AI Integration**: Google Gemini API for document processing and Q&A  
✅ **Authentication**: JWT-based user authentication  
✅ **Pagination**: Document listing with limit/offset pagination  
✅ **Rate Limiting**: 60 requests per minute per user  
✅ **Idempotency**: Support for Idempotency-Key headers  
✅ **Error Handling**: Consistent error format  
✅ **CORS**: Open CORS for development  
✅ **Private Documents**: User-based access control  
✅ **Query Caching**: 60-second cache for queries  
✅ **Source Citations**: Page references in answers

## 🚀 Deployment

The application is ready for deployment on platforms like:

- **Vercel** (frontend)
- **Railway/Render** (backend)
- **Supabase/PlanetScale** (database)

Make sure to update environment variables and CORS settings for production deployment.



