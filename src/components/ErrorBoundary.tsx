import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('App error:', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-md p-4 space-y-4">
          <div className="card border border-red-700/60">
            <div className="font-semibold text-red-300">Something broke</div>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-neutral-300">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={this.reset}
              >
                Retry
              </button>
              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
