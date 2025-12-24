import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useSupabaseAuth, OAuthProvider } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { SiGoogle, SiApple, SiGithub, SiX } from "react-icons/si";

interface SocialLoginButtonsProps {
  mode: "signin" | "signup";
}

const providers: { id: OAuthProvider; name: string; icon: typeof SiGoogle }[] = [
  { id: "google", name: "Google", icon: SiGoogle },
  { id: "apple", name: "Apple", icon: SiApple },
  { id: "github", name: "GitHub", icon: SiGithub },
  { id: "twitter", name: "X", icon: SiX },
];

export function SocialLoginButtons({ mode }: SocialLoginButtonsProps) {
  const { signInWithOAuth, isSupabaseConfigured } = useSupabaseAuth();
  const { toast } = useToast();
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    if (!isSupabaseConfigured) {
      toast({
        title: "Configuration Error",
        description: "Social login is not properly configured.",
        variant: "destructive",
      });
      return;
    }

    setLoadingProvider(provider);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        toast({
          title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} login failed`,
          description: error.message || "Failed to connect with provider",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingProvider(null);
    }
  };

  const actionText = mode === "signin" ? "Sign in" : "Sign up";

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {providers.map((provider) => {
          const Icon = provider.icon;
          const isLoading = loadingProvider === provider.id;
          
          return (
            <Button
              key={provider.id}
              type="button"
              variant="outline"
              className="gap-2"
              disabled={loadingProvider !== null}
              onClick={() => handleOAuthLogin(provider.id)}
              data-testid={`button-oauth-${provider.id}`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {provider.name}
            </Button>
          );
        })}
      </div>
      
      <p className="text-xs text-center text-muted-foreground">
        {actionText} with a social account for instant verification
      </p>
    </div>
  );
}
