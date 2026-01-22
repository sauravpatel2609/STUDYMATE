// ===================================
// Chat Page
// ===================================

import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { ChatInterface } from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 px-6 py-4 border-b border-border"
      >
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          AI Chat
        </h1>
        <p className="text-sm text-muted-foreground">
          Ask questions about your uploaded documents
        </p>
      </motion.div>

      {/* Chat Interface */}
      <ChatInterface className="flex-1 min-h-0" />
    </div>
  );
}
