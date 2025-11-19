import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Terminal, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface PasswordGateProps {
  onAuthenticated: () => void;
}

export default function PasswordGate({ onAuthenticated }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);
    
    try {
      const response = await fetch("/api/authenticate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        localStorage.setItem("auth_token", data.token);
        onAuthenticated();
      } else {
        setError(true);
        setAttempts(prev => prev + 1);
        setPassword("");
      }
    } catch (err) {
      setError(true);
      setAttempts(prev => prev + 1);
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="border border-primary/30 rounded bg-card p-8 shadow-lg shadow-primary/20">
          <div className="flex items-center justify-center mb-8">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <Shield className="w-16 h-16 text-primary" />
            </motion.div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary mb-2 font-mono">
              [ SECURE ACCESS ]
            </h1>
            <p className="text-muted-foreground text-sm font-mono">
              {"> "}AUTHENTICATION REQUIRED
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-mono text-foreground flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                PASSWORD:
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Enter access code..."
                className="font-mono bg-background border-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground"
                autoFocus
                data-testid="input-password"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-destructive text-sm font-mono flex items-center gap-2"
              >
                <span>[!]</span>
                <span>ACCESS DENIED - Invalid credentials ({attempts} attempts)</span>
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full font-mono"
              disabled={isLoading}
              data-testid="button-authenticate"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  [ VERIFYING... ]
                </>
              ) : (
                "[ AUTHENTICATE ]"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-xs text-muted-foreground font-mono space-y-1">
              <p>{"> "}System: SECURE_TERMINAL_v2.1</p>
              <p>{"> "}Status: <span className="text-primary">ONLINE</span></p>
              <p>{"> "}Encryption: AES-256</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center text-xs text-muted-foreground font-mono"
        >
          <p>Unauthorized access is strictly prohibited</p>
          <p className="text-primary/60">All activities are logged and monitored</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
