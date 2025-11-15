import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import LoadingIndicator from "@/components/LoadingIndicator";
import EmptyState from "@/components/EmptyState";
import ThemeToggle from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Message as DbMessage } from "@shared/schema";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: dbMessages = [] } = useQuery<DbMessage[]>({
    queryKey: ["/api/chat-sessions", currentSessionId, "messages"],
    enabled: !!currentSessionId,
  });

  const messages = useMemo(() => {
    return dbMessages.map(msg => ({ 
      role: msg.role as "user" | "assistant", 
      content: msg.content 
    }));
  }, [dbMessages]);

  const createSessionMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest("POST", "/api/chat-sessions", { title });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-sessions"] });
      setCurrentSessionId(data.id);
    },
  });

  const saveMessagesMutation = useMutation({
    mutationFn: async ({ sessionId, messages }: { sessionId: string; messages: Message[] }) => {
      await apiRequest("POST", `/api/chat-sessions/${sessionId}/messages`, {
        messages: messages.map(msg => ({
          chatSessionId: sessionId,
          role: msg.role,
          content: msg.content,
        })),
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, sessionId }: { content: string; sessionId: string }) => {
      const updatedMessages = [
        ...messages,
        { role: "user" as const, content }
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      return {
        userMessage: { role: "user" as const, content },
        aiMessage: { role: "assistant" as const, content: data.message }
      };
    },
    onMutate: async ({ content, sessionId }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/chat-sessions", sessionId, "messages"] });
      
      const previousMessages = queryClient.getQueryData<DbMessage[]>(["/api/chat-sessions", sessionId, "messages"]);
      
      queryClient.setQueryData<DbMessage[]>(
        ["/api/chat-sessions", sessionId, "messages"],
        (old = []) => [
          ...old,
          { 
            id: -Date.now(),
            chatSessionId: sessionId,
            role: "user",
            content
          }
        ]
      );

      return { previousMessages };
    },
    onSuccess: async (data, variables) => {
      const { sessionId } = variables;
      
      queryClient.setQueryData<DbMessage[]>(
        ["/api/chat-sessions", sessionId, "messages"],
        (old = []) => {
          const filtered = old.filter(msg => msg.id >= 0);
          return [
            ...filtered,
            { 
              id: -Date.now() - 1,
              chatSessionId: sessionId,
              role: data.userMessage.role,
              content: data.userMessage.content
            },
            { 
              id: -Date.now() - 2,
              chatSessionId: sessionId,
              role: data.aiMessage.role,
              content: data.aiMessage.content
            }
          ];
        }
      );
      
      await saveMessagesMutation.mutateAsync({
        sessionId,
        messages: [data.userMessage, data.aiMessage],
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ["/api/chat-sessions", sessionId, "messages"] 
      });
    },
    onError: (_error, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["/api/chat-sessions", variables.sessionId, "messages"],
          context.previousMessages
        );
      }
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    },
  });

  const handleSend = async (content: string) => {
    setIsLoading(true);

    try {
      let sessionId = currentSessionId;

      if (!sessionId) {
        const title = content.slice(0, 50);
        const newSession = await createSessionMutation.mutateAsync(title);
        sessionId = newSession.id;
      }

      if (sessionId) {
        await sendMessageMutation.mutateAsync({ content, sessionId });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  return (
    <>
      <AppSidebar
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
      />
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between px-6 py-4 border-b" data-testid="header">
          <div className="flex items-center gap-2">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-xl font-semibold">AI Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                data-testid="button-clear"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          {messages.length === 0 && !isLoading ? (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="flex-1 overflow-y-auto" data-testid="messages-container">
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    role={message.role}
                    content={message.content}
                  />
                ))}
                {isLoading && <LoadingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          <ChatInput onSend={handleSend} disabled={isLoading} />
        </main>
      </div>
    </>
  );
}
