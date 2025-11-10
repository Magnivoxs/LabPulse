import React from "react";

export default class ErrorBoundary extends React.Component<any, {error:any}> {
  state = { error: null };

  static getDerivedStateFromError(error:any){ return { error }; }

  render(){ 
    return this.state.error ? (
      <div style={{padding:16}}>App error: {String(this.state.error)}</div>
    ) : this.props.children; 
  }
}

