import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Login from './pages/Login';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />

        <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Home />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/customers" element={<Customers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
