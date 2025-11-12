import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Home from '@/pages/index.jsx'
import Shared from '@/pages/share/index.jsx'
import Layout from './layout/index'

function NotFoundRedirect() {
  return <Navigate to="/" replace />
}
function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shared" element={<Shared />} />
          <Route path="*" element={<NotFoundRedirect />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
