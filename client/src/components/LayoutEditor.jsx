import React, { useState, useRef, useEffect } from "react";
import "./LayoutEditor.css";
import LAYER_TYPES from "./LAYER_TYPES";
import DRC, { runDRC } from "./DRC";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const GRID_SIZE = 20; // pixels per grid cell
const MIN_LAYER_SIZE = 1; // Minimum size of a layer in grid cells
const LAMBDA_PER_GRID = 1; // 1 lambda per grid cell

// Helper function to check if two layers overlap
const doLayersOverlap = (layer1, layer2) => {
  return !(
    layer1.x + layer1.width <= layer2.x ||
    layer2.x + layer2.width <= layer1.x ||
    layer1.y + layer1.height <= layer2.y ||
    layer2.y + layer2.height <= layer1.y
  );
};

// DRC Rules
const DRC_RULES = {
  minWidth: 2, // minimum width in lambda
  minSpacing: 2, // minimum spacing between layers in lambda
  minEnclosure: 1, // minimum enclosure in lambda
  wellMinSize: 10, // N-well/P-well minimum size in lambda
};

const LayoutEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [layout, setLayout] = useState({
    name: "",
    description: "",
    layoutData: {
      layers: [],
    },
  });
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedLayerType, setSelectedLayerType] = useState("metal1");
  const [showDRC, setShowDRC] = useState(false);
  const [drcViolations, setDrcViolations] = useState([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveFormData, setSaveFormData] = useState({
    name: "",
    description: "",
  });
  const canvasRef = useRef(null);

  useEffect(() => {
    if (id) {
      // Load existing layout
      axios
        .get(`http://localhost:5000/api/layouts/${id}`)
        .then((response) => {
          setLayout(response.data);
          setSaveFormData({
            name: response.data.name,
            description: response.data.description,
          });
        })
        .catch((error) => {
          console.error("Error loading layout:", error);
        });
    }
  }, [id]);

  // DRC Check Functions
  const checkMinWidth = (layer) => {
    if (layer.type === "n_well" || layer.type === "p_well") {
      return (
        layer.width >= DRC_RULES.wellMinSize &&
        layer.height >= DRC_RULES.wellMinSize
      );
    }
    return layer.width >= DRC_RULES.minWidth;
  };

  const checkMinSpacing = (layer, otherLayers) => {
    return otherLayers.every((otherLayer) => {
      if (otherLayer.id === layer.id) return true;

      const horizontalSpacing = Math.min(
        Math.abs(layer.x + layer.width - otherLayer.x),
        Math.abs(otherLayer.x + otherLayer.width - layer.x)
      );

      const verticalSpacing = Math.min(
        Math.abs(layer.y + layer.height - otherLayer.y),
        Math.abs(otherLayer.y + otherLayer.height - layer.y)
      );

      return (
        horizontalSpacing >= DRC_RULES.minSpacing ||
        verticalSpacing >= DRC_RULES.minSpacing
      );
    });
  };

  const runDRCCheck = () => {
    const violations = runDRC(layout.layoutData.layers);
    setDrcViolations(violations);
    return violations.length === 0;
  };

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
    e.stopPropagation();
    setSelectedLayer(layer);
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gridPos = screenToGrid(x, y);

    // Sort layers by area (smallest to largest) to check for clicks
    const layersAtPosition = [...layout.layoutData.layers]
      .sort((a, b) => a.width * a.height - b.width * b.height)
      .filter((layer) => {
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
      const topLayer = layersAtPosition[0]; // This will be the smallest layer
      setSelectedLayer(topLayer);
      setIsDragging(true);
      setDragOffset({
        x: gridPos.x - topLayer.x,
        y: gridPos.y - topLayer.y,
      });
    } else {
      // Only start drawing if we're not just clicking
      if (e.shiftKey) {
        // Hold Shift key to start drawing
        setStartPos(gridPos);
        setCurrentPos(gridPos);
        setIsDrawing(true);
        setSelectedLayer(null);
      } else {
        setSelectedLayer(null); // Just clear selection if clicking empty space
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gridPos = screenToGrid(x, y);

    if (isDragging && selectedLayer) {
      const newX = Math.max(0, gridPos.x - dragOffset.x);
      const newY = Math.max(0, gridPos.y - dragOffset.y);

      setLayout((prev) => ({
        ...prev,
        layoutData: {
          ...prev.layoutData,
          layers: prev.layoutData.layers.map((layer) => {
            if (layer.id === selectedLayer.id) {
              return {
                ...layer,
                x: newX,
                y: newY,
              };
            }
            return layer;
          }),
        },
      }));
      runDRCCheck(); // Add DRC check during dragging
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

        setLayout((prev) => ({
          ...prev,
          layoutData: {
            ...prev.layoutData,
            layers: [...prev.layoutData.layers, newLayer],
          },
        }));
      }
    }

    setIsDrawing(false);
    setIsDragging(false);
    runDRCCheck();
  };

  const handleDeleteLayer = () => {
    if (selectedLayer) {
      setLayout((prev) => ({
        ...prev,
        layoutData: {
          ...prev.layoutData,
          layers: prev.layoutData.layers.filter(
            (layer) => layer.id !== selectedLayer.id
          ),
        },
      }));
      setSelectedLayer(null);
      runDRCCheck();
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

  const handleSaveClick = () => {
    if (!runDRCCheck()) {
      alert("Cannot save layout with DRC errors. Please fix the errors first.");
      return;
    }
    setShowSaveForm(true);
  };

  const handleSaveFormChange = (e) => {
    const { name, value } = e.target;
    setSaveFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!saveFormData.name.trim()) {
      alert("Please enter a name for the layout");
      return;
    }

    try {
      const layoutToSave = {
        ...layout,
        name: saveFormData.name,
        description: saveFormData.description,
      };

      if (id) {
        await axios.put(
          `http://localhost:5000/api/layouts/${id}`,
          layoutToSave,
          { withCredentials: true }
        );
      } else {
        await axios.post("http://localhost:5000/api/layouts", layoutToSave, {
          withCredentials: true,
        });
      }

      navigate("/layouts");
    } catch (error) {
      console.error("Error saving layout:", error);
    }
  };

  const handleCancelSave = () => {
    setShowSaveForm(false);
  };

  return (
    <div className="layout-editor">
      <div className="toolbar">
        <div className="action-buttons">
          <button onClick={() => setShowDRC(true)}>Run DRC</button>
          <button onClick={handleSaveClick}>Save Layout</button>
        </div>
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
      </div>

      {showDRC && (
        <DRC
          layers={layout.layoutData.layers}
          onClose={() => setShowDRC(false)}
        />
      )}

      <div className="canvas-container">
        <div
          ref={canvasRef}
          className="canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ position: "relative", width: "100%", height: "100%" }}
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

          {/* Layers */}
          {layout.layoutData.layers
            .sort((a, b) => {
              const areaA = a.width * a.height;
              const areaB = b.width * b.height;
              return areaB - areaA; // Sort by area (largest to smallest) so smaller layers render last and appear on top
            })
            .map((layer, index) => {
              const isOverlapping = layout.layoutData.layers.some(
                (otherLayer) =>
                  otherLayer.id !== layer.id &&
                  doLayersOverlap(layer, otherLayer)
              );
              const hasDrcError = drcViolations.some(
                (violation) => violation.layerId === layer.id
              );

              // Define patterns for different layer types
              const getLayerPattern = (type) => {
                switch (type) {
                  case "metal1":
                    return {
                      backgroundImage:
                        "linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0, 10px 10px",
                    };
                  case "metal2":
                    return {
                      backgroundImage:
                        "linear-gradient(90deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0",
                    };
                  case "poly":
                    return {
                      backgroundImage:
                        "linear-gradient(0deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0",
                    };
                  case "n_well":
                    return {
                      backgroundImage:
                        "radial-gradient(circle, #000 2px, transparent 2px)",
                      backgroundSize: "10px 10px",
                      backgroundPosition: "0 0",
                    };
                  case "p_well":
                    return {
                      backgroundImage:
                        "radial-gradient(circle, #000 2px, transparent 2px)",
                      backgroundSize: "10px 10px",
                      backgroundPosition: "5px 5px",
                    };
                  case "n_diffusion":
                    return {
                      backgroundImage:
                        "linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
                      backgroundSize: "10px 10px",
                      backgroundPosition: "0 0",
                    };
                  case "p_diffusion":
                    return {
                      backgroundImage:
                        "linear-gradient(-45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
                      backgroundSize: "10px 10px",
                      backgroundPosition: "0 0",
                    };
                  case "polycontact":
                    return {
                      backgroundImage:
                        "linear-gradient(0deg, #000 50%, transparent 50%, transparent 100%, #000 100%, #000)",
                      backgroundSize: "5px 5px",
                      backgroundPosition: "0 0",
                    };
                  case "pdcontact":
                    return {
                      backgroundImage:
                        "linear-gradient(90deg, #000 50%, transparent 50%, transparent 100%, #000 100%, #000)",
                      backgroundSize: "5px 5px",
                      backgroundPosition: "0 0",
                    };
                  case "ndcontact":
                    return {
                      backgroundImage:
                        "linear-gradient(90deg, #000 50%, transparent 50%, transparent 100%, #000 100%, #000)",
                      backgroundSize: "5px 5px",
                      backgroundPosition: "0 0",
                    };
                  case "psubstratepcontact":
                    return {
                      backgroundImage:
                        "linear-gradient(90deg, #000 50%, transparent 50%, transparent 100%, #000 100%, #000)",
                      backgroundSize: "5px 5px",
                      backgroundPosition: "0 0",
                    };
                  case "nsubstratencontact":
                    return {
                      backgroundImage:
                        "linear-gradient(90deg, #000 50%, transparent 50%, transparent 100%, #000 100%, #000)",
                      backgroundSize: "5px 5px",
                      backgroundPosition: "0 0",
                    };
                  default:
                    return {};
                }
              };

              return (
                <div
                  key={layer.id}
                  className={`layer ${
                    selectedLayer?.id === layer.id ? "selected" : ""
                  } ${isOverlapping ? "overlapping" : ""} ${
                    hasDrcError ? "drc-error" : ""
                  }`}
                  data-pattern={layer.type}
                  style={{
                    position: "absolute",
                    left: layer.x * GRID_SIZE,
                    top: layer.y * GRID_SIZE,
                    width: layer.width * GRID_SIZE,
                    height: layer.height * GRID_SIZE,
                    backgroundColor: layer.color,
                    ...getLayerPattern(layer.type),
                    zIndex: index, // Higher index means higher in the stack
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
        {drcViolations.length > 0 && (
          <div className="drc-violations">
            <h4>DRC Violations:</h4>
            {drcViolations.map((violation, index) => (
              <div
                key={`${violation.layerId}-${violation.type}-${index}`}
                className={`drc-violation ${
                  selectedLayer?.id === violation.layerId
                    ? "selected-layer-violation"
                    : ""
                }`}
              >
                {violation.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {showSaveForm && (
        <div className="save-form-overlay">
          <div className="save-form">
            <h3>Save Layout</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="name">Layout Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={saveFormData.name}
                  onChange={handleSaveFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={saveFormData.description}
                  onChange={handleSaveFormChange}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">
                  Save
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancelSave}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutEditor;
