import { useRouteError, useNavigate } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logError } from "@/lib/error-logger";
import { useEffect } from "react";

/**
 * Route-specific error boundary for React Router
 * Catches errors in route components
 */
export const RouteErrorBoundary = () => {
  const error = useRouteError() as Error;
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      logError(error, 'RouteError');
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Page Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We encountered an error loading this page.
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Error details
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={() => navigate(-1)} 
              variant="outline" 
              className="flex-1"
            >
              Go Back
            </Button>
            <Button 
              onClick={() => navigate("/")} 
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
