import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/header/Header";
import { DataStudioDrawer } from "@/components/drawer/DataStudioDrawer";

export default function AppLayout() {
  const [vibeOpen, setVibeOpen] = useState(false);
  return (
    <>
      <Header onOpenVibe={() => setVibeOpen(true)} />
      <main><Outlet /></main>
      <DataStudioDrawer open={vibeOpen} onClose={() => setVibeOpen(false)} />
    </>
  );
}

