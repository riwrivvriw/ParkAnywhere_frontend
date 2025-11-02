import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

interface Slot {
  _id: string;
  name: string;
  rentedAt?: string;
  available: boolean;
}

const API_URL = import.meta.env.VITE_URL_API;

export default function Home() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmRent, setConfirmRent] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await fetch(`${API_URL}/slots`);
        const data: Slot[] = await res.json();
        setSlots(data);
      } catch (err) {
        console.error(err);
        setStatus("Failed to fetch slots");
      }
    };
    fetchSlots();
  }, []);

  const finalizeRent = async () => {
    if (!selectedSlot) return;
    try {
      const res = await fetch(`${API_URL}/slots/rent/${selectedSlot._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) setStatus(data.error || "Failed to rent slot");
      else {
        setStatus("Slot rented successfully!");
        setSelectedSlot(null);
        navigate("/my-slot");
      }
    } catch (err) {
      console.error(err);
      setStatus("Network error");
    } finally {
      setLoading(false);
      setConfirmRent(false);
    }
  };

  const handleRent = async () => {
    if (!selectedSlot) return;

    if (!confirmRent) {
      setConfirmRent(true);
      return;
    }

    setStatus(`Sending command to server for Slot :${selectedSlot.name}...`);
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API_URL}/gate/mqtt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "OPEN" }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const data = await res.json();
        setStatus(data.error || "Failed to send command");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setStatus(`Gate ${data.ack} opened, finalizing rent...`);
      finalizeRent();

    } catch (err: any) {
      if (err.name === "AbortError") setStatus("Timeout waiting for gate to open");
      else setStatus("Network error");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", paddingTop: "50px" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Parking Slots</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {slots.map(slot => (
            <div
              key={slot._id}
              style={{
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                width: 250,
                height: 60,
                margin: "0 auto",
                border: "1px solid #ccc",
                borderRadius: "10px",
                padding: "15px",
                backgroundColor: slot.available ? "#d4edda" : "#f8d7da",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>{slot.name}</h3>
                <p style={{ margin: 0 }}>{slot.available ? "Available" : "Occupied"}</p>
              </div>
              {slot.available && (
                <button
                  disabled={loading}
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Rent
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Modal confirm rent */}
        {selectedSlot && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1200,
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "15px",
                width: "90%",
                maxWidth: "300px",
                textAlign: "center",
              }}
            >
              <h2>Confirm Rent</h2>
              <p>Slot: {selectedSlot.name}</p>
              <p>Cost: 1 บาท / นาที</p>
              <p style={{color: 'red'}}><strong>!โปรดอ่านก่อนใช้บริการ!</strong></p>
              <p>หลังจากกดเช่า ไม้กั้นจะเปิดอัตโนมัติ</p>

              {status && (
                <p style={{ color: status.includes("Failed") || status.includes("Timeout") ? "#dc3545" : "#555", margin: "10px 0" }}>
                  {status}
                </p>
              )}

              {confirmRent && !loading && (
                <p style={{ color: "#dc3545", margin: "10px 0" }}>
                  กดยืนยันอีกครั้งเพื่อเช่า
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
                <button
                  onClick={handleRent}
                  disabled={loading}
                  style={{
                    padding: "10px",
                    flex: 1,
                    marginRight: "5px",
                    backgroundColor: confirmRent ? "#dc3545" : "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  {loading ? "Loading..." : confirmRent ? "Confirm" : "Rent"}
                </button>
                <button
                  onClick={() => { setSelectedSlot(null); setConfirmRent(false); setStatus(""); }}
                  disabled={loading}
                  style={{
                    padding: "10px",
                    flex: 1,
                    marginLeft: "5px",
                    backgroundColor: "#ccc",
                    border: "none",
                    borderRadius: "5px",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
