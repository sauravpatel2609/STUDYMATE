// ===================================
// Dashboard Page
// ===================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  MessageSquare,
  Upload,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { documentsApi, chatApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/FileUpload';
import { Spinner } from '@/components/Spinner';

interface Stats {
  totalDocuments: number;
  totalChunks: number;
  totalChats: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [documents, chatHistory] = await Promise.all([
          documentsApi.list(),
          chatApi.history().catch(() => []),
        ]);

        setStats({
          totalDocuments: documents.length,
          totalChunks: documents.reduce((sum, doc) => sum + doc.num_chunks, 0),
          totalChats: chatHistory.length,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleUploadComplete = async () => {
    // Refresh stats after upload
    const documents = await documentsApi.list();
    setStats(prev => prev ? {
      ...prev,
      totalDocuments: documents.length,
      totalChunks: documents.reduce((sum, doc) => sum + doc.num_chunks, 0),
    } : null);
  };

  const statCards = [
    {
      title: 'Documents',
      value: stats?.totalDocuments ?? 0,
      icon: FileText,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Knowledge Chunks',
      value: stats?.totalChunks ?? 0,
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      title: 'Questions Asked',
      value: stats?.totalChats ?? 0,
      icon: MessageSquare,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="gradient-text">{user?.username || 'Student'}</span>
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your study workspace
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card variant="glass" className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated" className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Quick Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showUpload ? (
                <div className="space-y-4">
                  <FileUpload onUploadComplete={handleUploadComplete} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUpload(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    Upload PDFs to expand your knowledge base
                  </p>
                  <Button variant="brand" onClick={() => setShowUpload(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Start Chat Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="elevated" className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Study Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  Ask questions about your documents and get instant answers with citations
                </p>
                <Button variant="brand" asChild>
                  <Link to="/chat">
                    Start Chatting
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium">Upload Documents</p>
                  <p className="text-sm text-muted-foreground">
                    Add your study materials in PDF format
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium">Ask Questions</p>
                  <p className="text-sm text-muted-foreground">
                    Use natural language to query your documents
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium">Get Answers</p>
                  <p className="text-sm text-muted-foreground">
                    Receive cited responses from your materials
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
