import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import LoadingIndicator from "@/components/LoadingIndicator";
import EmptyState from "@/components/EmptyState";
import ThemeToggle from "@/components/ThemeToggle";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    //todo: remove mock functionality - replace with actual API call to OpenRouter
    setTimeout(() => {
      const aiMessage: Message = {
        role: "assistant",
        content: `This is a mock response. Once the backend is connected, I'll use OpenRouter's API with DeepSeek to generate real AI responses to: "${content}"`,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b" data-testid="header">
        <h1 className="text-xl font-semibold">AI Chat</h1>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
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
  );
}
