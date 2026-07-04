import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from '../views/pages/HomePage.jsx'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
