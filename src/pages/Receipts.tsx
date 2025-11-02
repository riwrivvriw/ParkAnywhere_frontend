import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

interface Receipt {
  _id: string;
  username: string;
  slot: string;
  rentedAt: string;
  stoppedAt: string;
  minutes: number;
  cost: number;
}
const API_URL = import.meta.env.VITE_URL_API;


export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const username = localStorage.getItem("username");

  useEffect(() => {
    const fetchReceipts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/receipts/${username}`);
        const data: Receipt[] = await res.json();
        setReceipts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (username) fetchReceipts();
  }, [username]);

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h : ${mins}m`;
  };

  return (
    <div style={{ minHeight: "100vh", paddingTop: "50px" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div style={{ padding: "10px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2>Receipts</h2>

        {isLoading ? (
          <p style={{ textAlign: "center", color: "#888" }}>Loading...</p>
        ) : receipts.length === 0 ? (
          <p>No receipts yet.</p>
        ) : (
          <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {receipts.map((r) => {
              const rentedDate = new Date(r.rentedAt);
              const stoppedDate = new Date(r.stoppedAt);
              return (
                <div key={r._id} style={{ padding: "10px", borderRadius: "10px", backgroundColor: "#333", color: "#fff" }}>
                  <p><strong>Slot:</strong> {r.slot}</p>
                  <p><strong>Rented Date:</strong> {rentedDate.toLocaleDateString()}</p>
                  <p><strong>Stopped Date:</strong> {stoppedDate.toLocaleDateString()}</p>
                  <p><strong>Rented Time:</strong> {rentedDate.toLocaleTimeString()} - {stoppedDate.toLocaleTimeString()}</p>
                  <p><strong>Total Time:</strong> {formatTime(r.minutes)}</p>
                  <p><strong>Cost:</strong> {r.cost} ฿</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
