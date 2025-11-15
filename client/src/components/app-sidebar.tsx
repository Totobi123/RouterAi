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
        <Button
          onClick={onNewChat}
          className="w-full"
          data-testid="button-new-chat"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chat History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="px-4 py-2 text-sm text-muted-foreground">Loading...</div>
              ) : sessions.length === 0 ? (
                <div className="px-4 py-2 text-sm text-muted-foreground">No chats yet</div>
              ) : (
                sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <div className="flex items-center gap-2 w-full">
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
                        className="flex-shrink-0"
                        data-testid={`button-delete-${session.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
