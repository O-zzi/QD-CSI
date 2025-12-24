import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { supabase, isSupabaseAuthConfigured } from "@/lib/supabase";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const [status, setStatus] = useState<"checking" | "verified" | "pending" | "error">("checking");

  useEffect(() => {
    const handleVerification = async () => {
      const hash = window.location.hash;
      
      if (hash && hash.includes("access_token")) {
        if (isSupabaseAuthConfigured() && supabase) {
          try {
            const searchParams = new URLSearchParams(hash.substring(1));
            const accessToken = searchParams.get("access_token");
            const refreshToken = searchParams.get("refresh_token");

            if (accessToken && refreshToken) {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (data.session && !error) {
                setStatus("verified");
                setTimeout(() => {
                  setLocation("/");
                }, 2000);
                return;
              }
            }
          } catch (err) {
            console.error("Verification error:", err);
          }
        }
      }

      if (!isLoading) {
        if (isAuthenticated) {
          setStatus("verified");
          setTimeout(() => {
            setLocation("/");
          }, 2000);
        } else {
          setStatus("pending");
        }
      }
    };

    handleVerification();
  }, [isAuthenticated, isLoading, setLocation]);

  if (status === "checking" || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Verifying Email</CardTitle>
            <CardDescription>Please wait while we verify your email address...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified. Redirecting you shortly...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full" data-testid="button-go-home">
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error" || !isSupabaseAuthConfigured()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Verification Failed</CardTitle>
            <CardDescription>
              This verification link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/login">
              <Button className="w-full" data-testid="button-go-to-login">
                Go to Sign In
              </Button>
            </Link>
            <p className="text-center text-sm text-muted-foreground">
              Need a new verification link? Sign up again or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to your email address. Click the link in the email to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>The link will expire in 24 hours.</p>
            <p className="mt-2">Didn't receive the email? Check your spam folder.</p>
          </div>
          <Link href="/login">
            <Button variant="outline" className="w-full" data-testid="button-back-to-login">
              Back to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
