import { MessageSquare, Plus, Trash2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ChatSession } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface AppSidebarProps {
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
}

export function AppSidebar({ currentSessionId, onSessionSelect, onNewChat }: AppSidebarProps) {
  const { data: sessions = [], isLoading } = useQuery<ChatSession[]>({
    queryKey: ["/api/chat-sessions"],
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await apiRequest("DELETE", `/api/chat-sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-sessions"] });
    },
  });

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm("Delete this chat?")) {
      deleteSessionMutation.mutate(sessionId);
      if (currentSessionId === sessionId) {
        onNewChat();
      }
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={onNewChat}
            className="w-full"
            data-testid="button-new-chat"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </motion.div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chat History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <motion.div 
                    className="px-4 py-2 text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Loading...
                  </motion.div>
                ) : sessions.length === 0 ? (
                  <motion.div 
                    className="px-4 py-2 text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    No chats yet
                  </motion.div>
                ) : (
                  sessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      <SidebarMenuItem>
                        <div className="flex items-center gap-2 w-full group">
                          <SidebarMenuButton
                            onClick={() => onSessionSelect(session.id)}
                            isActive={currentSessionId === session.id}
                            className="flex-1"
                            data-testid={`chat-session-${session.id}`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="truncate">{session.title}</span>
                          </SidebarMenuButton>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDelete(e, session.id)}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-delete-${session.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </SidebarMenuItem>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
