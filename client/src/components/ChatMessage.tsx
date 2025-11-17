import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { audioCache } from "@/lib/audioCache";
import CodeBlock from "@/components/CodeBlock";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [cachedAudio, setCachedAudio] = useState<string | null>(audioBase64 || null);
  const { toast } = useToast();

  useEffect(() => {
    if (messageId && !cachedAudio) {
      audioCache.get(messageId).then(audio => {
        if (audio) {
          setCachedAudio(audio);
        }
      }).catch(err => console.error('Failed to load cached audio:', err));
    }
  }, [messageId, cachedAudio]);

  const handlePlayAudio = async () => {
    if (isPlaying || isGenerating) return;

    try {
      let audioData = cachedAudio;
      
      if (!audioData) {
        setIsGenerating(true);
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
        
        if (messageId && audioData) {
          await audioCache.set(messageId, audioData);
        }
        
        setIsGenerating(false);
      }

      if (!audioData) {
        throw new Error("No audio data available");
      }

      setIsPlaying(true);
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
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "Failed to generate or play audio",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`message-${role}`}
    >
      {!isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        >
          <Avatar className="w-8 h-8 flex-shrink-0" data-testid="avatar-ai">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}
      
      <div className="flex flex-col gap-2">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.2 }}
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
                code: ({node, inline, className, children, ...props}: any) => {
                  if (inline) {
                    return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
                  }
                  
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : undefined;
                  const code = String(children).replace(/\n$/, '');
                  
                  return <CodeBlock language={language} inline={false}>{code}</CodeBlock>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </motion.div>
        
        {!isUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayAudio}
              disabled={isPlaying || isGenerating}
              className="w-fit hover-elevate active-elevate-2"
              data-testid="button-play-audio"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isPlaying ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                </motion.div>
              ) : (
                <Volume2 className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? "Generating..." : isPlaying ? "Playing..." : cachedAudio ? "Play Audio" : "Generate Audio"}
            </Button>
          </motion.div>
        )}
      </div>

      {isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        >
          <Avatar className="w-8 h-8 flex-shrink-0" data-testid="avatar-user">
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}
    </motion.div>
  );
}
