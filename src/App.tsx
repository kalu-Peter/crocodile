import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CrocodileLodge from "./CrocodileLodge";
import Gallery from "./Gallery";
import ReservationPage from "./pages/ReservationPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CrocodileLodge />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/reservation" element={<ReservationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
