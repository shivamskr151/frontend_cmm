import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryProvider } from './providers/QueryProvider'

// Only use StrictMode in development to reduce double API calls
const AppComponent = import.meta.env.DEV ? (
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>
) : (
  <QueryProvider>
    <App />
  </QueryProvider>
);

createRoot(document.getElementById('root')!).render(AppComponent)
