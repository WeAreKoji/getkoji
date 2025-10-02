import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logInfo } from "@/lib/error-logger";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logInfo(`Route not found: ${location.pathname}`, 'NotFound');
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle className="text-6xl font-bold text-primary">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex gap-2 justify-center pt-4">
            <Button asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/discover">
                <Search className="w-4 h-4 mr-2" />
                Discover
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
