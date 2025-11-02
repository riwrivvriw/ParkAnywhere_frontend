interface Props {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "50px",
        backgroundColor: "#333",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        padding: "0 15px",
        zIndex: 1100,
      }}
    >
      <button
        onClick={onMenuClick}
        style={{
          fontSize: "1.5rem",
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        ☰
      </button>
      <h1 style={{ margin: 0, marginLeft: "15px", fontSize: "1.2rem" }}>Parking In KUSRC</h1>
    </div>
  );
}
