import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Login from "./pages/Login";
import Home from "./pages/Home";
import MySlot from "./pages/MySlot";
import ReceiptsPage from "./pages/Receipts";
import Sidebar from "./components/Sidebar";
import Register from "./pages/Register";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Router>
        <Routes>
          {/* หน้า Login แยกไม่มี Sidebar */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Layout หลัก: มี Sidebar + Content */}
          <Route
            path="/*"
            element={
              <div style={{ display: "flex", minHeight: "100vh" }}>
                <Sidebar
                  isOpen={isSidebarOpen}
                  onClose={() => setIsSidebarOpen(false)}
                />
                <div style={{ flex: 1, backgroundColor: "#fdfdfd" }}>
                  <Routes>
                    <Route path="/home" element={<Home />} />
                    <Route path="/my-slot" element={<MySlot />} />
                    <Route path="/receipts" element={<ReceiptsPage />} />
                  </Routes>
                </div>
              </div>
            }
          />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
