import React, { useState } from "react";
import LayoutEditor from "../LayoutEditor";
import DRC from "../DRC";
// import "./App.css";
import "./Layout.css";

function Layout() {
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

export default Layout;
