import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorOverlay from './components/common/ErrorOverlay';

createRoot(document.getElementById('root')).render(
    <AuthProvider>
      <ThemeProvider>
        <ErrorOverlay>
          <Toaster 
            position="top-center" 
            reverseOrder={false} 
            containerStyle={{
              zIndex: 99999
            }}
          />
          <App />
        </ErrorOverlay>
      </ThemeProvider>
    </AuthProvider>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
