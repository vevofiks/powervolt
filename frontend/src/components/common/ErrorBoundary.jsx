import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', padding:'24px', textAlign:'center' }}>
          <div style={{ width:64, height:64, borderRadius:16, background:'#fef2f2', color:'#ef4444', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, marginBottom:20 }}>⚠</div>
          <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:8 }}>Something went wrong</h2>
          <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:20 }}>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} style={{ padding:'10px 24px', background:'#16a34a', color:'#fff', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
