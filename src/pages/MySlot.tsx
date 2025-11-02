import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

interface Slot {
  _id: string;
  name: string;
  renter?: string;
  rentedAt?: string;
  available?: boolean;
}

const API_URL = import.meta.env.VITE_URL_API;


export default function MySlot() {
  const [mySlots, setMySlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [cost, setCost] = useState(0);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const [stopLoading, setStopLoading] = useState(false);

  const username = localStorage.getItem("username");
  if (!username) window.location.href = "/";

  const fetchMySlots = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/slots`);
      const data: Slot[] = await res.json();
      const userSlots = data.filter(slot => slot.renter === username);
      setMySlots(userSlots);
    } catch (err) {
      console.error(err);
      setStatus("Failed to fetch your slots");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMySlots();
  }, []);

  useEffect(() => {
    if (!selectedSlot?.rentedAt) return;
    const interval = setInterval(() => {
      const rentedDate = new Date(selectedSlot.rentedAt!);
      const now = new Date();
      const diffMs = now.getTime() - rentedDate.getTime();
      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const seconds = Math.floor((diffMs % 60000) / 1000);

      setElapsedTime(
        `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`
      );
      setCost(totalMinutes);
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedSlot]);

  const finalizeStopRent = async () => {
    if (!selectedSlot) return;
    try {
      const res = await fetch(`http://localhost:3000/gate/mqtt/stop/${selectedSlot._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Failed to stop rent");
        setStopLoading(false);
        return;
      }

      alert(`ค่าใช้จ่ายทั้งหมด ${cost} บาท`);
      setMySlots(prev => prev.filter(slot => slot._id !== selectedSlot._id));
      setSelectedSlot(null);
      setConfirmStop(false);
      setStopLoading(false);
      setStatus("Rent stopped and receipt generated");
    } catch (err) {
      console.error(err);
      setStatus("Network error");
      setStopLoading(false);
    }
  };

  const handleStopRent = async () => {
    if (!selectedSlot) return;

    if (!confirmStop) {
      setConfirmStop(true);
      return;
    }

    setStatus("Sending CLOSE command...");
    setStopLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch("http://localhost:3000/gate/mqtt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "CLOSE" }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const data = await res.json();
        setStatus(data.error || "Failed to send command");
        setStopLoading(false);
        return;
      }

      const data = await res.json();
      setStatus(`Gate ${data.ack}, finalizing stop rent...`);
      finalizeStopRent();
    } catch (err: any) {
      if (err.name === "AbortError") setStatus("Timeout waiting for gate to close.");
      else setStatus("Network error");
      setStopLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", paddingTop: "50px" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>My Slots</h1>

        {isLoading ? (
          <p style={{ textAlign: "center" }}>Loading...</p>
        ) : mySlots.length === 0 ? (
          <p style={{ textAlign: "center" }}>You have no rented slots.</p>
        ) : (
          mySlots.map(slot => {
            const sinceDate = slot.rentedAt ? new Date(slot.rentedAt) : null;
            const formattedSince = sinceDate
              ? `${sinceDate.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })} ${sinceDate.toLocaleDateString()}`
              : "";

            return (
              <div key={slot._id} onClick={() => setSelectedSlot(slot)}
                style={{
                  margin: "0 auto",
                  marginBottom: 12,
                  width: 300,
                  borderRadius: "15px",
                  padding: "20px",
                  backgroundColor: "#e0f7fa",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                }}
              >
                <h3 style={{ margin: 0 }}>{slot.name}</h3>
                <p style={{ margin: 0, color: "#555" }}>Rented by you</p>
                {slot.rentedAt && (
                  <p style={{ margin: 0, color: "#777", fontSize: "0.9em" }}>
                    Since: {formattedSince}
                  </p>
                )}
              </div>
            );
          })
        )}

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
              <h2>Stop Rent</h2>
              <p>Slot: {selectedSlot.name}</p>
              <p>Elapsed Time: {elapsedTime}</p>
              <p>Cost: {cost} บาท</p>
              <p style={{color: 'red'}}>
                <strong>
                  !โปรดอ่านก่อนใช้บริการ! 
                </strong>
                <br></br>
              </p>
              <p>
                <strong>หลังจากกดหยุดเช่า ไม้กั้นจะปิดอัตโนมัติ</strong>
              </p>

              {status && (
                <p style={{ color: status.includes("Failed") || status.includes("Timeout") ? "#dc3545" : "#555", margin: "10px 0" }}>
                  {status}
                </p>
              )}

              {confirmStop && !stopLoading && (
                <p style={{ color: "#dc3545", margin: "10px 0" }}>
                  กดยืนยันอีกครั้งเพื่อหยุดการเช่า
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
                <button
                  onClick={handleStopRent}
                  disabled={stopLoading}
                  style={{
                    flex: 1,
                    marginRight: "5px",
                    padding: "10px",
                    backgroundColor: confirmStop ? "#dc3545" : "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                  }}
                >
                  {stopLoading ? "Processing..." : confirmStop ? "Confirm" : "Stop Rent"}
                </button>

                <button
                  onClick={() => { setSelectedSlot(null); setConfirmStop(false); setStatus(""); }}
                  disabled={stopLoading}
                  style={{
                    flex: 1,
                    marginLeft: "5px",
                    padding: "10px",
                    backgroundColor: "#ccc",
                    border: "none",
                    borderRadius: "5px",
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
