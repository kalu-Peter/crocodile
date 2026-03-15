import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CrocodileLodge from "./CrocodileLodge";
import Gallery from "./Gallery";
import ReservationPage from "./pages/ReservationPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CrocodileLodge />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/reservation" element={<ReservationPage />} />
        <Route path="/crocodile-admin" element={<AdminLoginPage />} />
        <Route path="/crocodile-admin/dashboard" element={<AdminDashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
