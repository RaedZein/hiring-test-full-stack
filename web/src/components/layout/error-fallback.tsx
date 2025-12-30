import { FallbackProps } from 'react-error-boundary';
import { Button } from '../ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * Full-page error fallback component
 *
 * Displayed when React crashes (unhandled render errors).
 * Shows a friendly message and reload button.
 */
export function ErrorFallback({ resetErrorBoundary }: FallbackProps) {
  const handleReload = () => {
    resetErrorBoundary();
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Please try reloading the page.
          </p>
        </div>

        <Button onClick={handleReload} size="lg">
          Reload Page
        </Button>
      </div>
    </div>
  );
}
