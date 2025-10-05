"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { Upload, FileText, Eye, EyeOff, Trash2, RefreshCw } from "lucide-react";

interface Document {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  isPrivate: boolean;
  shareToken: string | null;
  processedAt: string | null;
}

export default function DocsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPrivate, setIsPrivate] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchDocuments();
  }, [user, router]);

  const fetchDocuments = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/docs`,
        {
          params: { limit: 10, offset: currentOffset },
        }
      );

      const { items, next_offset } = response.data;

      if (reset) {
        setDocuments(items);
        setOffset(10);
      } else {
        setDocuments((prev) => [...prev, ...items]);
        setOffset((prev) => prev + 10);
      }

      setHasMore(next_offset !== null);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("isPrivate", isPrivate.toString());

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/docs`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setSelectedFile(null);
      fetchDocuments(true); // Refresh the list
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.response?.data?.error?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const processDocument = async (documentId: string) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/index/rebuild`);
      fetchDocuments(true); // Refresh the list
    } catch (error) {
      console.error("Error processing document:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
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
              <h1 className="text-3xl font-bold text-gray-900">
                KnowledgeScout
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/ask"
                className="text-primary-600 hover:text-primary-500"
              >
                Ask Questions
              </Link>
              <Link
                href="/admin"
                className="text-primary-600 hover:text-primary-500"
              >
                Admin
              </Link>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Document
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isPrivate"
                className="ml-2 block text-sm text-gray-900"
              >
                Keep document private
              </label>
            </div>

            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </button>
          </form>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Your Documents</h2>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No documents
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading a document.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-gray-400 mr-4" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {doc.originalName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(doc.fileSize)} •{" "}
                        {new Date(doc.uploadDate).toLocaleDateString()}
                        {doc.isPrivate ? (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Private
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Eye className="h-3 w-3 mr-1" />
                            Public
                          </span>
                        )}
                        {doc.processedAt ? (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Processed
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!doc.processedAt && (
                      <button
                        onClick={() => processDocument(doc.id)}
                        className="text-primary-600 hover:text-primary-500"
                        title="Process document"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                    {doc.shareToken && (
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `${window.location.origin}/docs/shared/${doc.shareToken}`
                          )
                        }
                        className="text-gray-600 hover:text-gray-500"
                        title="Copy share link"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => fetchDocuments()}
                className="w-full text-center text-primary-600 hover:text-primary-500 font-medium"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

