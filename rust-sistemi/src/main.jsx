import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

console.log("%c🚀 MAIN.JSX - BUILD: 999", "font-size: 30px; color: lime; font-weight: bold;");

createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>,
)
