import React, { useState, useMemo } from 'react';
import { Plus, MessageSquare, Search, Pencil, Trash2, MoreHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface Conversation {
  id: string;
  conversation_title: string | null;
  context_type: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  selectedId,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
  searchQuery,
  onSearchChange,
  isLoading,
  isMobile = false,
  onClose,
}) => {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const groups: Record<string, Conversation[]> = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const filtered = searchQuery.trim()
      ? conversations.filter((c) =>
          c.conversation_title?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : conversations;

    filtered.forEach((conv) => {
      const convDate = new Date(conv.updated_at);
      if (convDate >= today) {
        groups['Today'].push(conv);
      } else if (convDate >= yesterday) {
        groups['Yesterday'].push(conv);
      } else if (convDate >= weekAgo) {
        groups['Previous 7 Days'].push(conv);
      } else {
        groups['Older'].push(conv);
      }
    });

    return groups;
  }, [conversations, searchQuery]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleRenameClick = (conv: Conversation) => {
    setSelectedConversation(conv);
    setNewTitle(conv.conversation_title || '');
    setRenameDialogOpen(true);
  };

  const handleDeleteClick = (conv: Conversation) => {
    setSelectedConversation(conv);
    setDeleteDialogOpen(true);
  };

  const handleRenameConfirm = () => {
    if (selectedConversation && newTitle.trim()) {
      onRename(selectedConversation.id, newTitle.trim());
    }
    setRenameDialogOpen(false);
    setSelectedConversation(null);
    setNewTitle('');
  };

  const handleDeleteConfirm = () => {
    if (selectedConversation) {
      onDelete(selectedConversation.id);
    }
    setDeleteDialogOpen(false);
    setSelectedConversation(null);
  };

  const getContextIcon = (contextType: string | null) => {
    // Could add different icons based on context type
    return <MessageSquare className="h-4 w-4" />;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <Button onClick={onNewChat} className="flex-1" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          {isMobile && onClose && (
            <Button variant="ghost" size="icon" className="ml-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-sm font-medium mb-1">No conversations yet</h3>
              <p className="text-xs text-muted-foreground">
                Start a new chat to get help with your warehouse operations
              </p>
            </div>
          ) : (
            Object.entries(groupedConversations).map(
              ([group, convs]) =>
                convs.length > 0 && (
                  <div key={group} className="mb-4">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {group}
                    </div>
                    <div className="space-y-0.5">
                      {convs.map((conv) => (
                        <div
                          key={conv.id}
                          className={cn(
                            'group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors',
                            'hover:bg-accent',
                            selectedId === conv.id && 'bg-accent'
                          )}
                          onClick={() => {
                            onSelect(conv.id);
                            if (isMobile && onClose) onClose();
                          }}
                        >
                          <div className="flex-shrink-0 text-muted-foreground">
                            {getContextIcon(conv.context_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {conv.conversation_title || 'New Conversation'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(conv.updated_at)}
                            </p>
                          </div>

                          {/* Action menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  'h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
                                  'focus:opacity-100'
                                )}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameClick(conv);
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(conv);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )
          )}
        </div>
      </ScrollArea>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
            <DialogDescription>Enter a new title for this conversation.</DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Conversation title..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameConfirm();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameConfirm}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
