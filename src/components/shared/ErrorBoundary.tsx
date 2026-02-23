import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <CardDescription>An error occurred while rendering this section</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-mono text-muted-foreground">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="me-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

interface PageErrorBoundaryProps {
  children: ReactNode
  pageName?: string
}

export function PageErrorBoundary({ children, pageName }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Oops! Something went wrong</CardTitle>
              <CardDescription>
                {pageName
                  ? `We encountered an error loading the ${pageName} page.`
                  : 'We encountered an unexpected error.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                Try refreshing the page. If the problem persists, please restart the application.
              </p>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="me-2 h-4 w-4" />
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
