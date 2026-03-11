import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CrocodileLodge from "./CrocodileLodge";
import Gallery from "./Gallery";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CrocodileLodge />} />
        <Route path="/gallery" element={<Gallery />} />
      </Routes>
    </Router>
  );
}

export default App;
