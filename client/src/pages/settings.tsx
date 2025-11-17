import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [openrouterApiKey, setOpenrouterApiKey] = useState("");
  const [murfApiKey, setMurfApiKey] = useState("");
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);
  const [showMurfKey, setShowMurfKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          if (data.hasOpenrouterKey) {
            setOpenrouterApiKey("••••••••••••••••••••");
          }
          if (data.hasMurfKey) {
            setMurfApiKey("••••••••••••••••••••");
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          openrouterApiKey: openrouterApiKey || undefined,
          murfApiKey: murfApiKey || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast({
        title: "Settings saved",
        description: "Your API keys have been updated successfully.",
      });
    } catch (error) {
      console.error("Save settings error:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  if (isFetching) {
    return (
      <>
        <AppSidebar
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewChat={handleNewChat}
        />
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppSidebar
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
      />
      <div className="flex flex-col flex-1">
        <motion.header 
          className="flex items-center justify-between px-6 py-4 border-b"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
          <ThemeToggle />
        </motion.header>

        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-2xl mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>API Settings</CardTitle>
                  <CardDescription>
                    Configure your API keys to use the chat and text-to-speech features.
                    If you don't provide keys, the application will use default keys (if available).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="openrouter-key" data-testid="label-openrouter-key">
                      OpenRouter API Key
                    </Label>
                    <div className="relative">
                      <Input
                        id="openrouter-key"
                        type={showOpenrouterKey ? "text" : "password"}
                        value={openrouterApiKey}
                        onChange={(e) => setOpenrouterApiKey(e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="pr-10"
                        data-testid="input-openrouter-key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowOpenrouterKey(!showOpenrouterKey)}
                        data-testid="button-toggle-openrouter-key"
                      >
                        {showOpenrouterKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get your API key from{" "}
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        data-testid="link-openrouter"
                      >
                        OpenRouter
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="murf-key" data-testid="label-murf-key">
                      Murf.ai API Key (Optional)
                    </Label>
                    <div className="relative">
                      <Input
                        id="murf-key"
                        type={showMurfKey ? "text" : "password"}
                        value={murfApiKey}
                        onChange={(e) => setMurfApiKey(e.target.value)}
                        placeholder="ap2_..."
                        className="pr-10"
                        data-testid="input-murf-key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowMurfKey(!showMurfKey)}
                        data-testid="button-toggle-murf-key"
                      >
                        {showMurfKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get your API key from{" "}
                      <a
                        href="https://murf.ai/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        data-testid="link-murf"
                      >
                        Murf.ai
                      </a>
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full"
                    data-testid="button-save-settings"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 w-4 h-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
}
