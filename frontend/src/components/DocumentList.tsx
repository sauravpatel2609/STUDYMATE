// ===================================
// Document List Component
// ===================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FileText, Trash2, MoreVertical, Search, Layers } from 'lucide-react';
import { documentsApi } from '@/services/api';
import { Document } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DocumentListProps {
  refreshTrigger?: number;
  onDocumentSelect?: (docIds: string[]) => void;
  selectable?: boolean;
  selectedIds?: string[];
}

export function DocumentList({
  refreshTrigger,
  onDocumentSelect,
  selectable = false,
  selectedIds = [],
}: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await documentsApi.list();
      setDocuments(docs);
    } catch (error) {
      toast({
        title: 'Failed to load documents',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const handleDelete = async () => {
    if (!deleteDocId) return;

    try {
      setIsDeleting(true);
      await documentsApi.delete(deleteDocId);
      setDocuments(prev => prev.filter(d => d.id !== deleteDocId));
      toast({
        title: 'Document deleted',
        description: 'The document has been removed',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Could not delete the document',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDocId(null);
    }
  };

  const handleSelect = (docId: string) => {
    if (!selectable || !onDocumentSelect) return;

    const isSelected = selectedIds.includes(docId);
    if (isSelected) {
      onDocumentSelect(selectedIds.filter(id => id !== docId));
    } else {
      onDocumentSelect([...selectedIds, docId]);
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      {documents.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex p-4 rounded-full bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">
            {documents.length === 0 ? 'No documents yet' : 'No documents found'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {documents.length === 0
              ? 'Upload your first PDF to get started'
              : 'Try a different search term'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredDocs.map((doc, index) => {
              const isSelected = selectedIds.includes(doc.id);
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    variant={isSelected ? 'glass-elevated' : 'interactive'}
                    onClick={() => handleSelect(doc.id)}
                    className={cn(
                      'p-4 group',
                      selectable && 'cursor-pointer',
                      isSelected && 'ring-2 ring-primary'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-lg transition-colors',
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                      )}>
                        <FileText className={cn(
                          'h-5 w-5',
                          !isSelected && 'text-primary'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" title={doc.filename}>
                          {doc.filename}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{format(new Date(doc.upload_date), 'MMM d, yyyy')}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {doc.num_chunks} chunks
                          </span>
                        </div>
                      </div>
                      {!selectable && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteDocId(doc.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The document and all its processed content will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Spinner size="sm" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
