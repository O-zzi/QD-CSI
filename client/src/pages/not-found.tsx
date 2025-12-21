import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Calendar, Users, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-16">
        <Card className="w-full max-w-lg mx-4">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-muted-foreground mb-2">404</div>
              <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-error-title">
                Page Not Found
              </h1>
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Here are some helpful links:
              </p>
              
              <Link href="/">
                <Button variant="outline" className="w-full justify-start gap-2" data-testid="link-home">
                  <Home className="h-4 w-4" />
                  Go to Homepage
                </Button>
              </Link>
              
              <Link href="/facilities">
                <Button variant="outline" className="w-full justify-start gap-2" data-testid="link-facilities">
                  <Calendar className="h-4 w-4" />
                  View Facilities
                </Button>
              </Link>
              
              <Link href="/#membership">
                <Button variant="outline" className="w-full justify-start gap-2" data-testid="link-membership">
                  <Users className="h-4 w-4" />
                  Membership Plans
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="gap-2"
                data-testid="button-go-back"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
