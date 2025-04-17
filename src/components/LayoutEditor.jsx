import React, { useState, useRef, useEffect } from "react";
import "./LayoutEditor.css";

const GRID_SIZE = 20; // pixels per grid cell
const MIN_LAYER_SIZE = 1; // Minimum size of a layer in grid cells
const LAMBDA_PER_GRID = 1; // 1 lambda per grid cell

const LAYER_TYPES = {
  metal1: {
    name: "Metal 1",
    color: "rgba(76, 175, 80, 0.5)",
    pattern: "metal1",
  },
  metal2: {
    name: "Metal 2",
    color: "rgba(33, 150, 243, 0.5)",
    pattern: "metal2",
  },

  P_diffusion: {
    name: "P_diffusion",
    color: "rgba(76, 175, 80, 0.5)",
    pattern: "P_diffusion",
    },

  N_diffusion: {
    name: "N_diffusion",
    color: "rgba(76, 175, 80, 0.5)",
    pattern: "N_diffusion",
    },

  via_1: {
    name: "Via_1",
    color: "rgba(76, 175, 80, 0.5)",
    pattern: "Via_1",
    },

  via_2: {
    name: "Via_2",
    color: "rgba(76, 175, 80, 0.5)",
    pattern: "Via_2",
    },

  
poly: {
    name: "Poly",
    color: "rgba(255, 152, 0, 0.5)",
    pattern: "poly",
  },
  
  nwell: {
    name: "N-Well",
    color: "rgba(121, 85, 72, 0.5)",
    pattern: "nwell",
  },
  pwell: {
    name: "P-Well",
    color: "rgba(96, 125, 139, 0.5)",
    pattern: "pwell",
  },
};

// Helper function to check if two layers overlap
const doLayersOverlap = (layer1, layer2) => {
  return !(
    layer1.x + layer1.width <= layer2.x ||
    layer2.x + layer2.width <= layer1.x ||
    layer1.y + layer1.height <= layer2.y ||
    layer2.y + layer2.height <= layer1.y
  );
};

const LayoutEditor = ({ layers, setLayers, onRunDRC }) => {
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedLayerType, setSelectedLayerType] = useState("metal1");
  const canvasRef = useRef(null);

  // Convert screen coordinates to grid coordinates
  const screenToGrid = (x, y) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scrollLeft = canvasRef.current.scrollLeft;
    const scrollTop = canvasRef.current.scrollTop;
    return {
      x: Math.floor((x + scrollLeft) / GRID_SIZE),
      y: Math.floor((y + scrollTop) / GRID_SIZE),
    };
  };

  // Convert grid coordinates to screen coordinates
  const gridToScreen = (x, y) => {
    const scrollLeft = canvasRef.current.scrollLeft;
    const scrollTop = canvasRef.current.scrollTop;
    return {
      x: x * GRID_SIZE - scrollLeft,
      y: y * GRID_SIZE - scrollTop,
    };
  };

  const handleLayerClick = (layer, e) => {
    e.stopPropagation(); // Prevent the click from reaching the canvas
    setSelectedLayer(layer);
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gridPos = screenToGrid(x, y);

    // Find all layers at this position (from top to bottom)
    const layersAtPosition = [...layers].reverse().filter((layer) => {
      const layerScreenPos = gridToScreen(layer.x, layer.y);
      const layerRect = {
        left: layerScreenPos.x,
        top: layerScreenPos.y,
        right: layerScreenPos.x + layer.width * GRID_SIZE,
        bottom: layerScreenPos.y + layer.height * GRID_SIZE,
      };
      return (
        x >= layerRect.left &&
        x <= layerRect.right &&
        y >= layerRect.top &&
        y <= layerRect.bottom
      );
    });

    if (layersAtPosition.length > 0) {
      // Select the top layer
      const topLayer = layersAtPosition[0];
      setSelectedLayer(topLayer);
      setIsDragging(true);
      setDragOffset({
        x: gridPos.x - topLayer.x,
        y: gridPos.y - topLayer.y,
      });
    } else {
      setStartPos(gridPos);
      setCurrentPos(gridPos);
      setIsDrawing(true);
      setSelectedLayer(null);
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gridPos = screenToGrid(x, y);

    if (isDragging && selectedLayer) {
      const newX = gridPos.x - dragOffset.x;
      const newY = gridPos.y - dragOffset.y;

      setLayers(
        layers.map((layer) => {
          if (layer.id === selectedLayer.id) {
            return {
              ...layer,
              x: newX,
              y: newY,
            };
          }
          return layer;
        })
      );
    } else if (isDrawing) {
      setCurrentPos(gridPos);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      const width = Math.abs(currentPos.x - startPos.x) + 1;
      const height = Math.abs(currentPos.y - startPos.y) + 1;

      if (width >= MIN_LAYER_SIZE && height >= MIN_LAYER_SIZE) {
        const newLayer = {
          id: Date.now(),
          x: Math.min(startPos.x, currentPos.x),
          y: Math.min(startPos.y, currentPos.y),
          width,
          height,
          type: selectedLayerType,
          color: LAYER_TYPES[selectedLayerType].color,
        };

        setLayers([...layers, newLayer]);
      }
    }

    setIsDrawing(false);
    setIsDragging(false);
  };

  const handleDeleteLayer = () => {
    if (selectedLayer) {
      setLayers(layers.filter((layer) => layer.id !== selectedLayer.id));
      setSelectedLayer(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      handleDeleteLayer();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedLayer]);

  return (
    <div className="layout-editor">
      <div className="toolbar">
        <div className="layer-type-selector">
          {Object.entries(LAYER_TYPES).map(([type, { name, color }]) => (
            <button
              key={type}
              className={`layer-type-button ${
                selectedLayerType === type ? "selected" : ""
              }`}
              onClick={() => setSelectedLayerType(type)}
              style={{ backgroundColor: color }}
              title={name}
            />
          ))}
        </div>
        <button onClick={handleDeleteLayer} disabled={!selectedLayer}>
          Delete Layer
        </button>
        <button onClick={onRunDRC}>Run DRC</button>
      </div>

      <div className="dimension-display">
        {selectedLayer && (
          <div className="dimension-info">
            <span>Width: {selectedLayer.width * LAMBDA_PER_GRID}λ</span>
            <span>Height: {selectedLayer.height * LAMBDA_PER_GRID}λ</span>
            <span>
              Position: ({selectedLayer.x * LAMBDA_PER_GRID}λ,{" "}
              {selectedLayer.y * LAMBDA_PER_GRID}λ)
            </span>
          </div>
        )}
      </div>

      <div
        className="canvas-container"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid */}
        <div className="grid">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="grid-line"
              style={{
                left: i * GRID_SIZE,
                top: 0,
                height: "100%",
              }}
            />
          ))}
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="grid-line"
              style={{
                top: i * GRID_SIZE,
                left: 0,
                width: "100%",
              }}
            />
          ))}
        </div>

        {/* Grid Labels */}
        <div className="grid-labels">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`x-${i}`}
              className="grid-label x-label"
              style={{ left: i * GRID_SIZE * 5, top: -20 }}
            >
              {i * LAMBDA_PER_GRID * 5}λ
            </div>
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`y-${i}`}
              className="grid-label y-label"
              style={{ top: i * GRID_SIZE * 5, left: -40 }}
            >
              {i * LAMBDA_PER_GRID * 5}λ
            </div>
          ))}
        </div>

        {/* Layers */}
        {layers
          .sort((a, b) => {
            // Sort layers by area (smaller layers on top)
            const areaA = a.width * a.height;
            const areaB = b.width * b.height;
            return areaA - areaB;
          })
          .map((layer, index) => {
            const isOverlapping = layers.some(
              (otherLayer) =>
                otherLayer.id !== layer.id && doLayersOverlap(layer, otherLayer)
            );

            const isHidden = layers.some(
              (otherLayer) =>
                otherLayer.id !== layer.id &&
                isLayerCompletelyCovered(layer, otherLayer)
            );

            return (
              <div
                key={layer.id}
                className={`layer ${
                  selectedLayer?.id === layer.id ? "selected" : ""
                } ${isOverlapping ? "overlapping" : ""} ${
                  isHidden ? "hidden" : ""
                }`}
                data-pattern={layer.type}
                style={{
                  position: "absolute",
                  left: layer.x * GRID_SIZE,
                  top: layer.y * GRID_SIZE,
                  width: layer.width * GRID_SIZE,
                  height: layer.height * GRID_SIZE,
                  backgroundColor: layer.color,
                  zIndex: index,
                }}
                onClick={(e) => handleLayerClick(layer, e)}
              />
            );
          })}

        {/* Current drawing preview */}
        {isDrawing && (
          <div
            className="preview-layer"
            style={{
              position: "absolute",
              left: Math.min(startPos.x, currentPos.x) * GRID_SIZE,
              top: Math.min(startPos.y, currentPos.y) * GRID_SIZE,
              width: (Math.abs(currentPos.x - startPos.x) + 1) * GRID_SIZE,
              height: (Math.abs(currentPos.y - startPos.y) + 1) * GRID_SIZE,
            }}
          />
        )}
      </div>
    </div>
  );
};

// Helper function to check if one layer is completely covered by another
const isLayerCompletelyCovered = (layer1, layer2) => {
  return (
    layer2.x <= layer1.x &&
    layer2.y <= layer1.y &&
    layer2.x + layer2.width >= layer1.x + layer1.width &&
    layer2.y + layer2.height >= layer1.y + layer1.height
  );
};

export default LayoutEditor;
