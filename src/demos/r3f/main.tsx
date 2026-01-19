import React from 'react'
import ReactDOM from 'react-dom/client'
import EtherealAtomDemoPage from './EtherealAtomDemoPage'
import '../../index.css' // Import global styles if available/needed

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <EtherealAtomDemoPage />
    </React.StrictMode>,
)
