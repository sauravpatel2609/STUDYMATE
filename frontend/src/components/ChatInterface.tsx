// ===================================
// Chat Interface Component
// ===================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Send,
  Bot,
  User,
  FileText,
  ChevronDown,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { chatApi } from '@/services/api';
import { ChatHistoryItem, ChatSource } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DocumentList } from '@/components/DocumentList';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  timestamp: Date;
}

interface ChatInterfaceProps {
  className?: string;
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await chatApi.history();
        const formattedMessages: Message[] = [];
        
        history.forEach((item: ChatHistoryItem) => {
          formattedMessages.push({
            id: `q-${item.timestamp}`,
            type: 'user',
            content: item.question,
            timestamp: new Date(item.timestamp),
          });
          formattedMessages.push({
            id: `a-${item.timestamp}`,
            type: 'assistant',
            content: item.answer,
            sources: item.sources,
            timestamp: new Date(item.timestamp),
          });
        });

        setMessages(formattedMessages);
      } catch (error) {
        // History load failure is non-critical
        console.log('Could not load chat history');
      }
    };

    loadHistory();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatApi.query({
        message: userMessage.content,
        document_ids: selectedDocIds.length > 0 ? selectedDocIds : undefined,
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(response.timestamp),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Failed to get response',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Document Selector */}
      <Collapsible open={showDocSelector} onOpenChange={setShowDocSelector}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-4 py-2 h-auto"
          >
            <span className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              {selectedDocIds.length > 0
                ? `${selectedDocIds.length} document${selectedDocIds.length > 1 ? 's' : ''} selected`
                : 'Search all documents'}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                showDocSelector && 'rotate-180'
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 border-b border-border">
            <DocumentList
              selectable
              selectedIds={selectedDocIds}
              onDocumentSelect={setSelectedDocIds}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
            <p className="text-muted-foreground max-w-sm">
              Ask questions about your uploaded documents. I'll provide answers with source citations.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex gap-3',
                  message.type === 'user' && 'justify-end'
                )}
              >
                {message.type === 'assistant' && (
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 h-fit">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[80%] space-y-2',
                    message.type === 'user' && 'items-end'
                  )}
                >
                  <div
                    className={cn(
                      'px-4 py-3',
                      message.type === 'user'
                        ? 'chat-bubble-user'
                        : 'chat-bubble-ai'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source, idx) => (
                        <Card
                          key={idx}
                          variant="glass"
                          className="px-2 py-1 text-xs flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">
                            {source.filename}
                          </span>
                        </Card>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {format(message.timestamp, 'h:mm a')}
                  </p>
                </div>

                {message.type === 'user' && (
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary h-fit">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 h-fit">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="chat-bubble-ai px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your documents..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            type="submit"
            variant="brand"
            size="icon-lg"
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
