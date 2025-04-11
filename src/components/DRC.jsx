import React from "react";
import "./DRC.css";

const DRC = ({ layers, onClose }) => {
  // Design rule constants (in lambda units)
  const DESIGN_RULES = {
    MIN_WIDTH: 2, // Minimum width for all layers
    MIN_AREA: 4, // Minimum area for all layers
    MIN_SPACING: 1, // Minimum spacing between any layers
    LAYER_SPECIFIC_SPACING: {
      metal1: {
        metal1: 2, // Metal1 to Metal1 spacing
        metal2: 1, // Metal1 to Metal2 spacing
        poly: 1, // Metal1 to Poly spacing
      },
      metal2: {
        metal1: 1, // Metal2 to Metal1 spacing
        metal2: 2, // Metal2 to Metal2 spacing
        poly: 1, // Metal2 to Poly spacing
      },
      poly: {
        metal1: 1, // Poly to Metal1 spacing
        metal2: 1, // Poly to Metal2 spacing
        poly: 1, // Poly to Poly spacing
      },
    },
    LAYER_MIN_WIDTH: {
      metal1: 2, // Metal1 minimum width
      metal2: 2, // Metal2 minimum width
      poly: 2, // Poly minimum width
      diffusion: 2, // Diffusion minimum width
      nwell: 2, // N-Well minimum width
      pwell: 2, // P-Well minimum width
    },
  };

  const checkOverlaps = () => {
    const violations = [];
    for (let i = 0; i < layers.length; i++) {
      for (let j = i + 1; j < layers.length; j++) {
        const layer1 = layers[i];
        const layer2 = layers[j];
        if (doLayersOverlap(layer1, layer2)) {
          violations.push({
            type: "overlap",
            layers: [layer1.id, layer2.id],
            message: `Layers ${layer1.id} and ${layer2.id} overlap`,
          });
        }
      }
    }
    return violations;
  };

  const checkMinimumSpacing = () => {
    const violations = [];
    for (let i = 0; i < layers.length; i++) {
      for (let j = i + 1; j < layers.length; j++) {
        const layer1 = layers[i];
        const layer2 = layers[j];

        // Get the specific spacing rule for these layer types
        const spacingRule =
          DESIGN_RULES.LAYER_SPECIFIC_SPACING[layer1.type]?.[layer2.type] ||
          DESIGN_RULES.MIN_SPACING;

        if (getLayerSpacing(layer1, layer2) < spacingRule) {
          violations.push({
            type: "spacing",
            layers: [layer1.id, layer2.id],
            message: `Layers ${layer1.id} (${layer1.type}) and ${layer2.id} (${layer2.type}) violate minimum spacing rule (${spacingRule}λ)`,
          });
        }
      }
    }
    return violations;
  };

  const checkLayerMinimumWidth = () => {
    const violations = [];
    layers.forEach((layer) => {
      const minWidth =
        DESIGN_RULES.LAYER_MIN_WIDTH[layer.type] || DESIGN_RULES.MIN_WIDTH;
      if (layer.width < minWidth || layer.height < minWidth) {
        violations.push({
          type: "width",
          layers: [layer.id],
          message: `Layer ${layer.id} (${layer.type}) violates minimum width rule (${minWidth}λ)`,
        });
      }
    });
    return violations;
  };

  const checkMinimumArea = () => {
    const violations = [];
    layers.forEach((layer) => {
      const area = layer.width * layer.height;
      if (area < DESIGN_RULES.MIN_AREA) {
        violations.push({
          type: "area",
          layers: [layer.id],
          message: `Layer ${layer.id} (${layer.type}) violates minimum area rule (${DESIGN_RULES.MIN_AREA}λ²)`,
        });
      }
    });
    return violations;
  };

  const doLayersOverlap = (layer1, layer2) => {
    return !(
      layer1.x + layer1.width <= layer2.x ||
      layer2.x + layer2.width <= layer1.x ||
      layer1.y + layer1.height <= layer2.y ||
      layer2.y + layer2.height <= layer1.y
    );
  };

  const getLayerSpacing = (layer1, layer2) => {
    const xSpacing = Math.max(
      layer2.x - (layer1.x + layer1.width),
      layer1.x - (layer2.x + layer2.width)
    );

    const ySpacing = Math.max(
      layer2.y - (layer1.y + layer1.height),
      layer1.y - (layer2.y + layer2.height)
    );

    return Math.max(xSpacing, ySpacing);
  };

  const runDRC = () => {
    const overlapViolations = checkOverlaps();
    const spacingViolations = checkMinimumSpacing();
    const widthViolations = checkLayerMinimumWidth();
    const areaViolations = checkMinimumArea();

    return [
      ...overlapViolations,
      ...spacingViolations,
      ...widthViolations,
      ...areaViolations,
    ];
  };

  const violations = runDRC();

  return (
    <div className="drc-panel">
      <div className="drc-header">
        <h2>Design Rule Check Results</h2>
        <button onClick={onClose} className="close-button">
          ×
        </button>
      </div>

      <div className="drc-content">
        {violations.length === 0 ? (
          <div className="drc-success">No design rule violations found!</div>
        ) : (
          <div className="drc-violations">
            <h3>Violations Found: {violations.length}</h3>
            <ul>
              {violations.map((violation, index) => (
                <li key={index} className={`violation ${violation.type}`}>
                  {violation.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DRC;
