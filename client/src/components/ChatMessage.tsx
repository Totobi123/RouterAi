import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  messageId?: number;
  audioBase64?: string | null;
  sessionId?: string | null;
}

export default function ChatMessage({ role, content, messageId, audioBase64, sessionId }: ChatMessageProps) {
  const isUser = role === "user";
  const [isPlaying, setIsPlaying] = useState(false);
  const [cachedAudio, setCachedAudio] = useState(audioBase64);
  const { toast } = useToast();

  const handlePlayAudio = async () => {
    if (isPlaying) return;

    setIsPlaying(true);
    try {
      let audioData = cachedAudio;
      
      if (!audioData) {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            text: content,
            messageId: messageId
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate audio");
        }

        const data = await response.json();
        audioData = data.audioBase64;
        setCachedAudio(audioData);
      }

      if (!audioData) {
        throw new Error("No audio data available");
      }

      const audioBlob = await fetch(
        `data:audio/mp3;base64,${audioData}`
      ).then((r) => r.blob());
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Error",
          description: "Failed to play audio",
          variant: "destructive",
        });
      };
      
      await audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
      toast({
        title: "Error",
        description: "Failed to generate or play audio",
        variant: "destructive",
      });
    }
  };

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
      
      <div className="flex flex-col gap-2">
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary text-primary-foreground max-w-[80%]"
              : "bg-card border border-card-border max-w-full"
          }`}
          data-testid={`content-${role}`}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({node, ...props}) => <p className="text-base mb-2 last:mb-0" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                code: ({node, className, children, ...props}: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const inline = !match;
                  return inline ? 
                    <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>{children}</code> : 
                    <code className="block bg-muted p-2 rounded text-sm overflow-x-auto" {...props}>{children}</code>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
        
        {!isUser && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayAudio}
            disabled={isPlaying}
            className="w-fit"
            data-testid="button-play-audio"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            {isPlaying ? "Playing..." : "Play Audio"}
          </Button>
        )}
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
