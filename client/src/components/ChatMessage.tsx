import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`message-${role}`}
    >
      {!isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0" data-testid="avatar-ai">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground max-w-[80%]"
            : "bg-card border border-card-border max-w-full"
        }`}
        data-testid={`content-${role}`}
      >
        <p className="text-base whitespace-pre-wrap break-words">{content}</p>
      </div>

      {isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0" data-testid="avatar-user">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
