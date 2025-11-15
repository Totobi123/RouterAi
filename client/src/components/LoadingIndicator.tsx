import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

export default function LoadingIndicator() {
  return (
    <div className="flex gap-4 justify-start" data-testid="loading-indicator">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      
      <div className="rounded-2xl px-4 py-3 bg-card border border-card-border">
        <div className="flex gap-1 items-center">
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-75" style={{ animationDelay: "0.15s" }} />
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-150" style={{ animationDelay: "0.3s" }} />
        </div>
      </div>
    </div>
  );
}
