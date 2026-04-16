export default function Footer() {
  return (
    <footer className="relative z-10 mt-6">
      <div
        className="window"
        style={{
          borderRadius: 0,
          border: "none",
          borderTop: "2px solid #8855aa",
          boxShadow: "none",
          background: "linear-gradient(180deg, #f5eeff, #e8d4f5)",
        }}
      >
        <div className="text-center py-4 px-3">
          <div
            className="pixel-label"
            style={{ fontSize: 8, color: "#9b5de5", letterSpacing: 2 }}
          >
            <span style={{ color: "#e84d98" }}>⋆｡°</span>
            <span style={{ color: "#ffc145" }}>✦</span>
            <span style={{ color: "#5bb8e8" }}>˚</span>
            <span style={{ color: "#e84d98" }}>✧</span>
            &nbsp;✧ NutriTracker ✧&nbsp;
            <span style={{ color: "#e84d98" }}>✧</span>
            <span style={{ color: "#5bb8e8" }}>˚</span>
            <span style={{ color: "#ffc145" }}>✦</span>
            <span style={{ color: "#e84d98" }}>°｡⋆</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
