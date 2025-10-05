"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { Send, FileText, ArrowLeft, Clock } from "lucide-react";

interface Document {
  id: string;
  originalName: string;
  processedAt: string | null;
}

interface QueryResult {
  answer: string;
  sources: string[];
  cached: boolean;
  cachedUntil?: string;
}

export default function AskPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchDocuments();
  }, [user, router]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/docs`
      );
      const processedDocs = response.data.items.filter(
        (doc: Document) => doc.processedAt
      );
      setDocuments(processedDocs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !selectedDocument) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ask`,
        {
          query: query.trim(),
          documentId: selectedDocument,
          k: 5,
        }
      );

      setResult(response.data);
    } catch (error: any) {
      console.error("Query error:", error);
      alert(error.response?.data?.error?.message || "Failed to process query");
    } finally {
      setLoading(false);
    }
  };

  if (documentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                href="/docs"
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Ask Questions
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/docs"
                className="text-primary-600 hover:text-primary-500"
              >
                Documents
              </Link>
              <Link
                href="/admin"
                className="text-primary-600 hover:text-primary-500"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No processed documents
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload and process documents first to ask questions.
            </p>
            <Link
              href="/docs"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Go to Documents
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Query Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Ask a Question</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Document
                  </label>
                  <select
                    value={selectedDocument}
                    onChange={(e) => setSelectedDocument(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Choose a document...</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.originalName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Question
                  </label>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything about the document..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !query.trim() || !selectedDocument}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Clock className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Ask Question
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Results */}
            {result && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Answer</h3>
                  {result.cached && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Cached
                    </span>
                  )}
                </div>

                <div className="prose max-w-none">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {result.answer}
                  </p>
                </div>

                {result.sources && result.sources.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Sources:
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {result.sources.map((source, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          {source}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


