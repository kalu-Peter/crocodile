import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CrocodileLodge from "./CrocodileLodge";
import Gallery from "./Gallery";
import ReservationPage from "./pages/ReservationPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import VillaDetailsPage from "./pages/VillaDetailsPage";
import PageTransition from "./components/PageTransition";
import { CurrencyProvider } from "./context/CurrencyContext";
import WhatsAppFloat from "./components/WhatsAppFloat";

function App() {
  return (
    <CurrencyProvider>
      <Router>
      <PageTransition>
        <Routes>
          <Route path="/" element={<CrocodileLodge />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/villa/:villaId" element={<VillaDetailsPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/reservation" element={<ReservationPage />} />
          <Route path="/crocodile-admin" element={<AdminLoginPage />} />
          <Route path="/crocodile-admin/dashboard" element={<AdminDashboardPage />} />
        </Routes>
      </PageTransition>
      <WhatsAppFloat />
    </Router>
    </CurrencyProvider>
  );
}

export default App;
