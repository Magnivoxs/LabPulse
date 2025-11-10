import { useEffect, useState } from "react";
import { LocalJsonStorage } from "@/storage/local-json";
import { seedOffices, seedStaff, seedMonthly } from "@/storage/seeds";

const storage = new LocalJsonStorage();

export default function DevStorageTest() {
  const [state, setState] = useState<{ offices: any[]; staff: any[]; monthly: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.loadAll().then((data) => {
      setState(data);
      setLoading(false);
    });
  }, []);

  const loadSeeds = async () => {
    await storage.saveAll({ offices: seedOffices, staff: seedStaff, monthly: seedMonthly });
    setState(await storage.loadAll());
  };

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  return (
    <div style={{ padding: 16 }}>
      <h1>Storage Smoke Test</h1>
      <p>Shows current storage contents. Click to load sample data.</p>
      <button onClick={loadSeeds}>Load Sample Data</button>
      <pre style={{ fontSize: 12, marginTop: 16 }}>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}

