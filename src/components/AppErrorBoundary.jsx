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
        <div className="card empty-state">
          <p className="eyebrow">Render Error</p>
          <h1 className="section-heading">This page hit a client-side error.</h1>
          <p className="empty-state__text">{this.state.errorMessage}</p>
          <button type="button" className="button button--primary" onClick={this.handleReset}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
