import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: string
}

interface State {
  hasError: boolean
  error: string
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
          <div className="w-12 h-12 rounded-full bg-accent-error/10 border border-accent-error/30 flex items-center justify-center text-accent-error text-2xl">
            ⚠
          </div>
          <div className="text-center max-w-md">
            <p className="font-display font-semibold text-white mb-2">
              {this.props.fallback || 'Something went wrong loading this section'}
            </p>
            <p className="text-accent-muted text-sm font-mono bg-bg-secondary border border-border-default rounded p-3 text-left">
              {this.state.error}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: '' })}
            className="btn-ghost text-sm"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
