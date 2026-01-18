import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    name: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error(`[ErrorBoundary: ${this.props.name}]`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '20px',
                    background: '#ff4444',
                    color: 'white',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap'
                }}>
                    <h2>Error in {this.props.name}</h2>
                    <p>{this.state.error?.message}</p>
                    <p>{this.state.error?.stack}</p>
                </div>
            );
        }

        return this.props.children;
    }
}
