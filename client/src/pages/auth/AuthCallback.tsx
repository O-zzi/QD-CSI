import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { supabase, isSupabaseAuthConfigured } from "@/lib/supabase";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      if (!isSupabaseAuthConfigured() || !supabase) {
        setStatus("error");
        setMessage("Authentication is not configured.");
        return;
      }

      try {
        const hash = window.location.hash;
        const searchParams = new URLSearchParams(hash.substring(1));
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        const type = searchParams.get("type");

        if (errorParam) {
          setStatus("error");
          setMessage(errorDescription || errorParam || "Authentication failed");
          return;
        }

        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Failed to set session:", error);
            setStatus("error");
            setMessage(error.message || "Failed to establish session");
            return;
          }

          if (data.session) {
            if (type === "recovery") {
              setStatus("success");
              setMessage("Session established. Redirecting to password reset...");
              setTimeout(() => {
                setLocation("/auth/reset-password");
              }, 500);
              return;
            }

            if (type === "signup" || type === "email_change") {
              setStatus("success");
              setMessage("Email verified successfully! Redirecting...");
              setTimeout(() => {
                setLocation("/");
              }, 1500);
              return;
            }

            setStatus("success");
            setMessage("Authentication successful! Redirecting...");
            setTimeout(() => {
              setLocation("/");
            }, 1000);
            return;
          }
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          if (type === "recovery") {
            setLocation("/auth/reset-password");
            return;
          }
          setStatus("success");
          setMessage("Already authenticated. Redirecting...");
          setTimeout(() => {
            setLocation("/");
          }, 1000);
          return;
        }

        setStatus("error");
        setMessage("No valid session found. Please try again.");
      } catch (err) {
        console.error("Auth callback exception:", err);
        setStatus("error");
        setMessage("An unexpected error occurred.");
      }
    };

    const timeout = setTimeout(handleCallback, 100);
    return () => clearTimeout(timeout);
  }, [setLocation]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Processing</CardTitle>
            <CardDescription>Please wait while we complete your request...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Success!</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Something Went Wrong</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/login">
            <Button className="w-full" data-testid="button-go-to-login">
              Go to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
