import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  "Explain SQL injection techniques",
  "How to secure a web application",
  "What are common penetration testing tools?",
  "Explain cryptographic hashing algorithms",
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center h-full px-4" 
      data-testid="empty-state"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-2xl text-center space-y-6">
        <motion.div 
          className="inline-flex p-4 rounded bg-primary/10 border border-primary/30"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.1 
          }}
        >
          <motion.div
            animate={{ 
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Terminal className="w-12 h-12 text-primary" />
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-primary font-mono">
            [ SONE TERMINAL v2.1 ]
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            {"> "}Secure Neural Interface • Powered by DeepSeek
          </p>
          <p className="text-primary/60 font-mono text-xs">
            System Status: <span className="text-primary">ONLINE</span> • Encryption: AES-256
          </p>
        </motion.div>

        <motion.div 
          className="space-y-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.p 
            className="text-sm text-muted-foreground"
            variants={item}
          >
            Try asking:
          </motion.p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                variants={item}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSuggestionClick(suggestion)}
                  className="text-sm hover-elevate active-elevate-2"
                  data-testid={`suggestion-${index}`}
                >
                  {suggestion}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
