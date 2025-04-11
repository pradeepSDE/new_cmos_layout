import React, { useState } from "react";
import LayoutEditor from "./components/LayoutEditor";
import DRC from "./components/DRC";
import "./App.css";

function App() {
  const [showDRC, setShowDRC] = useState(false);
  const [layers, setLayers] = useState([]);

  const handleRunDRC = () => {
    setShowDRC(true);
  };

  const handleCloseDRC = () => {
    setShowDRC(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>VLSI Layout Editor</h1>
      </header>
      <main>
        <LayoutEditor
          layers={layers}
          setLayers={setLayers}
          onRunDRC={handleRunDRC}
        />
        {showDRC && <DRC layers={layers} onClose={handleCloseDRC} />}
      </main>
    </div>
  );
}

export default App;
