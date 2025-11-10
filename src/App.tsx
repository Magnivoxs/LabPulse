import { Link } from "react-router-dom";

function App() {
  return (
    <div className="app">
      <h1>LabPulse</h1>
      <p>Operations intelligence dashboard prototype</p>
      <Link to="/dev-storage-test">Open Storage Smoke Test</Link>
    </div>
  );
}

export default App;

