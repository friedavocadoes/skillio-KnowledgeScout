"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  BarChart3,
  FileText,
  MessageSquare,
  Clock,
} from "lucide-react";

interface Stats {
  documents: {
    total: number;
    processed: number;
    unprocessed: number;
    processingRate: string;
  };
  queries: {
    total: number;
    recent: Array<{
      query: string;
      createdAt: string;
      document: { originalName: string };
    }>;
  };
  lastUpdated: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchStats();
  }, [user, router]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/index/stats`
      );
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/index/rebuild`);
      await fetchStats(); // Refresh stats
      alert("Document processing completed!");
    } catch (error: any) {
      console.error("Rebuild error:", error);
      alert(error.response?.data?.error?.message || "Failed to rebuild index");
    } finally {
      setRebuilding(false);
    }
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
              <Link
                href="/docs"
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/docs"
                className="text-primary-600 hover:text-primary-500"
              >
                Documents
              </Link>
              <Link
                href="/ask"
                className="text-primary-600 hover:text-primary-500"
              >
                Ask Questions
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">System Statistics</h2>
              <button
                onClick={fetchStats}
                className="text-primary-600 hover:text-primary-500"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            {stats && (
              <div className="space-y-6">
                {/* Document Stats */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Documents
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.documents.total}
                      </p>
                      <p className="text-sm text-gray-600">Total Documents</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {stats.documents.processed}
                      </p>
                      <p className="text-sm text-gray-600">Processed</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">
                        {stats.documents.unprocessed}
                      </p>
                      <p className="text-sm text-gray-600">Pending</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.documents.processingRate}%
                      </p>
                      <p className="text-sm text-gray-600">Processing Rate</p>
                    </div>
                  </div>
                </div>

                {/* Query Stats */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Queries
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.queries.total}
                    </p>
                    <p className="text-sm text-gray-600">Total Queries</p>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Last updated: {new Date(stats.lastUpdated).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Actions</h2>

            <div className="space-y-4">
              <button
                onClick={handleRebuild}
                disabled={rebuilding}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {rebuilding ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Processing Documents...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rebuild Document Index
                  </>
                )}
              </button>

              <p className="text-sm text-gray-600">
                This will process all unprocessed documents and make them
                available for Q&A.
              </p>
            </div>

            {/* Recent Queries */}
            {stats && stats.queries.recent.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Queries
                </h3>
                <div className="space-y-3">
                  {stats.queries.recent.map((query, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {query.query}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {query.document.originalName} •{" "}
                        {new Date(query.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


