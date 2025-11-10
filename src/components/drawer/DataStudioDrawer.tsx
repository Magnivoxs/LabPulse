import { useEffect, useState } from "react";
import ImportPanel from "@/components/data-studio/ImportPanel";
import EditPanel from "@/components/data-studio/EditPanel";

export function DataStudioDrawer({
  open, onClose
}: { open: boolean; onClose: () => void; }) {
  const [activeTab, setActiveTab] = useState<"import" | "edit" | "settings">("import");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.2)"}} />
      <aside style={{position:"fixed",top:0,left:0,bottom:0,width:520,background:"#fff",boxShadow:"2px 0 12px rgba(0,0,.1)",padding:12,zIndex:1000,overflowY:"auto"}}>
        <h2 style={{marginTop:0}}>Data Studio</h2>
        <nav style={{display:"flex",gap:8,marginBottom:16,borderBottom:"1px solid #eee",paddingBottom:8}}>
          <button 
            onClick={() => setActiveTab("import")}
            style={{
              background: activeTab === "import" ? "#f0f0f0" : "transparent",
              border: "none",
              padding: "8px 12px",
              cursor: "pointer",
              borderRadius: "4px"
            }}
          >
            Import
          </button>
          <button 
            onClick={() => setActiveTab("edit")}
            style={{
              background: activeTab === "edit" ? "#f0f0f0" : "transparent",
              border: "none",
              padding: "8px 12px",
              cursor: "pointer",
              borderRadius: "4px"
            }}
          >
            Edit
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            style={{
              background: activeTab === "settings" ? "#f0f0f0" : "transparent",
              border: "none",
              padding: "8px 12px",
              cursor: "pointer",
              borderRadius: "4px"
            }}
          >
            Settings
          </button>
        </nav>
        <div style={{fontSize:14}}>
          {activeTab === "import" && <ImportPanel />}
          {activeTab === "edit" && <EditPanel />}
          {activeTab === "settings" && <p>Storage: Local JSON (default)</p>}
        </div>
      </aside>
    </div>
  );
}

