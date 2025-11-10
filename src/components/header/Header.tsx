
export function Header({ onOpenVibe }: { onOpenVibe: () => void }) {
  return (
    <header style={{display:"flex",alignItems:"center",gap:12,padding:12,borderBottom:"1px solid #eee"}}>
      <h1 style={{margin:0,fontSize:18}}>LabPulse</h1>
      <div style={{marginLeft:"auto",display:"flex",gap:8}}>
        <button
          onClick={onOpenVibe}
          style={{
            padding: "6px 12px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          Upload
        </button>
      </div>
    </header>
  );
}

