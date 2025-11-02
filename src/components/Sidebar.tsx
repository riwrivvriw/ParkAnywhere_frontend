import React from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const handleNavigate = (path: string) => {
    // 1️⃣ ปิด sidebar ก่อน
    onClose();

    // 2️⃣ รอให้ transition ปิด (0.3s)
    setTimeout(() => {
      navigate(path);
    }, 300); // ให้ตรงกับ transition: "left 0.3s"
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div
      style={{
        marginTop: "50px",
        position: "fixed",
        top: 0,
        left: isOpen ? 0 : "-200px",
        width: "200px",
        height: "100vh",
        backgroundColor: "#333",
        color: "#fff",
        transition: "left 0.3s ease",
        zIndex: 1000,
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <h2>Menu</h2>
      <button style={buttonStyle} onClick={() => handleNavigate("/home")}>
        Home
      </button>
      <button style={buttonStyle} onClick={() => handleNavigate("/my-slot")}>
        My Slots
      </button>
      <button style={buttonStyle} onClick={() => handleNavigate("/receipts")}>
        Receipts
      </button>
      <button style={buttonStyle} onClick={handleLogout}>
        Logout
      </button>
      {username && (
        <p style={{ marginTop: "auto", color: "#ccc" }}>User: {username}</p>
      )}
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "10px",
  marginBottom: "10px",
  width: "100%",
  backgroundColor: "#555",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  textAlign: "left",
};
