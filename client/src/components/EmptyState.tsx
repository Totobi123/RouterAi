import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  "Explain quantum computing simply",
  "Write a haiku about coding",
  "What are the benefits of exercise?",
  "Suggest a healthy breakfast recipe",
];

export default function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4" data-testid="empty-state">
      <div className="max-w-2xl text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-primary/10">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Chat with Sone
          </h1>
          <p className="text-muted-foreground">
            Darkest gpt made by Genx !
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Try asking:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onSuggestionClick(suggestion)}
                className="text-sm hover-elevate active-elevate-2"
                data-testid={`suggestion-${index}`}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
