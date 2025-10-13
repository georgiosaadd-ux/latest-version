// Security monitoring and logging utilities
export class SecurityMonitor {
  private static events: Array<{
    type: string;
    timestamp: number;
    details: any;
  }> = [];

  // Log security events
  static logEvent(type: string, details: any = {}) {
    const event = {
      type,
      timestamp: Date.now(),
      details: {
        ...details,
        userAgent: navigator.userAgent.substring(0, 100),
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    };

    this.events.push(event);
    
    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SECURITY] ${type}:`, details);
    }

    // In production, you would send this to your monitoring service
    this.sendToMonitoring(event);
  }

  // Send to monitoring service (implement based on your monitoring solution)
  private static sendToMonitoring(event: any) {
    // Example: Send to your monitoring service
    // fetch('/api/security-events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // }).catch(console.error);
  }

  // Get recent events for debugging
  static getRecentEvents(limit: number = 10) {
    return this.events.slice(-limit);
  }

  // Check for suspicious patterns
  static detectSuspiciousActivity(): boolean {
    const recentEvents = this.events.filter(
      event => Date.now() - event.timestamp < 300000 // Last 5 minutes
    );

    // Too many failed attempts
    const failedAttempts = recentEvents.filter(
      event => event.type.includes('failed') || event.type.includes('error')
    );

    if (failedAttempts.length > 10) {
      this.logEvent('suspicious_activity_detected', {
        reason: 'too_many_failures',
        count: failedAttempts.length
      });
      return true;
    }

    // Too many rapid requests
    if (recentEvents.length > 50) {
      this.logEvent('suspicious_activity_detected', {
        reason: 'too_many_requests',
        count: recentEvents.length
      });
      return true;
    }

    return false;
  }
}

// Error boundary for security
export class SecurityErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    SecurityMonitor.logEvent('security_error_boundary', {
      error: error.message,
      stack: error.stack?.substring(0, 500)
    });
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    SecurityMonitor.logEvent('security_component_error', {
      error: error.message,
      componentStack: errorInfo.componentStack?.substring(0, 500)
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}