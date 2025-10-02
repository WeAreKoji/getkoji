import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logError } from "@/lib/error-logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Error boundary with retry functionality
 * Catches errors and provides option to retry the operation
 */
export class RetryBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logError(error, 'RetryBoundary');
    
    if (process.env.NODE_ENV === 'development') {
      console.info('Error Info:', errorInfo);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState((prevState) => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < maxRetries;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              
              {canRetry ? (
                <div className="space-y-2">
                  <Button
                    onClick={this.handleRetry}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry ({this.state.retryCount}/{maxRetries})
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Click retry to attempt loading again
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">
                    Maximum retry attempts reached.
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="w-full"
                  >
                    Reload Page
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
