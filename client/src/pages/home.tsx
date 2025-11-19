import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Terminal } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import LoadingIndicator from "@/components/LoadingIndicator";
import EmptyState from "@/components/EmptyState";
import ScrollToTop from "@/components/ScrollToTop";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Message as DbMessage } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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

  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      setShowScrollTop(scrollTop > 200 && scrollHeight > clientHeight + 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages]);

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
            content,
            audioBase64: null
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
              content: data.userMessage.content,
              audioBase64: null
            },
            { 
              id: -Date.now() - 2,
              chatSessionId: sessionId,
              role: data.aiMessage.role,
              content: data.aiMessage.content,
              audioBase64: null
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
        <motion.header 
          className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-primary/20 bg-card/50 backdrop-blur" 
          data-testid="header"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-primary font-mono truncate">[ SONE TERMINAL ]</h1>
              <p className="text-xs text-muted-foreground font-mono hidden sm:block">{"> "}neural.interface.active</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="px-2 py-1 bg-primary/10 border border-primary/30 rounded">
                STATUS: <span className="text-primary">ONLINE</span>
              </span>
            </div>
            <AnimatePresence>
              {messages.length > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewChat}
                    data-testid="button-clear"
                    className="min-h-11 min-w-11"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.header>

        <main className="flex-1 overflow-hidden flex flex-col relative">
          {messages.length === 0 && !isLoading ? (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto scroll-smooth" 
              data-testid="messages-container"
            >
              <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
                {dbMessages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    messageId={message.id}
                    role={message.role as "user" | "assistant"}
                    content={message.content}
                    audioBase64={message.audioBase64}
                    sessionId={currentSessionId}
                  />
                ))}
                {isLoading && <LoadingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          <ScrollToTop show={showScrollTop} onClick={scrollToTop} />
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </main>
      </div>
    </>
  );
}
