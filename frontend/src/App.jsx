import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/" element={<h1>EPF Marketplace</h1>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
