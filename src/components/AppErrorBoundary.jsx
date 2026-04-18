import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "An unexpected error interrupted the page.",
    };
  }

  componentDidCatch(error) {
    console.error("Application render error:", error);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel mt-6 max-w-3xl px-6 py-6 text-slate-700">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-600">
            Render Error
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-slate-950">
            This page hit a client-side error.
          </h1>
          <p className="mt-3 text-sm text-slate-600">{this.state.errorMessage}</p>
          <button type="button" className="btn-primary mt-5" onClick={this.handleReset}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
