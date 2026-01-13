import { useEffect, useState } from 'react';

const ErrorOverlay = ({ children }) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    const onError = (evt) => {
      setError({ message: evt.message || evt.reason?.message || 'Unknown error', stack: evt.error?.stack || evt.reason?.stack });
      // also log
      console.error('Captured error:', evt);
    };

    const onRejection = (evt) => {
      setError({ message: evt.reason?.message || JSON.stringify(evt.reason), stack: evt.reason?.stack });
      console.error('Unhandled rejection:', evt);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  if (!error) return children || null;

  return (
    <div style={{position:'fixed',top:0,right:0,bottom:0,left:0,background:'rgba(0,0,0,0.85)',color:'#fff',zIndex:999999,padding:20,overflow:'auto'}}>
      <div style={{maxWidth:980,margin:'40px auto',background:'#111',padding:20,borderRadius:8,boxShadow:'0 10px 40px rgba(0,0,0,0.6)'}}>
        <h2 style={{margin:0,marginBottom:8}}>Application Error</h2>
        <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word',fontSize:13,opacity:0.95}}>{error.message}</pre>
        {error.stack && <details style={{marginTop:12,color:'#ddd'}}><summary style={{cursor:'pointer'}}>Stack</summary><pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word',fontSize:12}}>{error.stack}</pre></details>}
      </div>
    </div>
  );
};

export default ErrorOverlay;
