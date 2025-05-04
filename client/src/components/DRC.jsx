import React from "react";
import "./DRC.css";

const DRC = ({ layers, onClose }) => {
  // Design rule constants (in lambda units)
  const DESIGN_RULES = {
    // Well rules
    WELL_MIN_SIZE: 10, // N-well/P-well minimum size
    WELL_SPACING: 4, // N-well to N-well spacing

    // Diffusion rules
    DIFF_MIN_SIZE: 3, // P+/N+ diffusion minimum size
    DIFF_TO_WELL_SPACING: 5, // N+ diffusion to N-well spacing
    DIFF_TO_SUBSTRATE_SPACING: 4, // Diffusion to substrate spacing

    // Poly rules
    POLY_MIN_WIDTH: 2, // Polysilicon minimum width
    POLY_OVERHANG: 2, // Poly overhang over transistor

    // Metal rules
    METAL1_MIN_SIZE: 3, // Metal 1 minimum size
    METAL1_SPACING: 3, // Metal 1 to Metal 1 spacing

    // Contact rules
    CONTACT_MIN_SIZE: 4, // Contact minimum size
    CONTACT_SPACING: 4, // Contact to contact spacing
    POLY_TO_CONTACT_SPACING: 1, // Poly to diffusion contact spacing
  };

  const checkWellRules = () => {
    const violations = [];
    layers.forEach((layer) => {
      if (layer.type === "n_well" || layer.type === "p_well") {
        if (
          layer.width < DESIGN_RULES.WELL_MIN_SIZE ||
          layer.height < DESIGN_RULES.WELL_MIN_SIZE
        ) {
          violations.push({
            type: "well",
            layers: [layer.id],
            message: `${layer.type.toUpperCase()} ${
              layer.id
            } violates minimum size rule (${DESIGN_RULES.WELL_MIN_SIZE}λ x ${
              DESIGN_RULES.WELL_MIN_SIZE
            }λ)`,
          });
        }
      }
    });

    // Check well spacing
    layers.forEach((layer1) => {
      if (layer1.type === "n_well") {
        layers.forEach((layer2) => {
          if (layer2.type === "n_well" && layer1.id !== layer2.id) {
            const spacing = getLayerSpacing(layer1, layer2);
            if (spacing < DESIGN_RULES.WELL_SPACING) {
              violations.push({
                type: "well",
                layers: [layer1.id, layer2.id],
                message: `N-wells ${layer1.id} and ${layer2.id} violate minimum spacing rule (${DESIGN_RULES.WELL_SPACING}λ)`,
              });
            }
          }
        });
      }
    });

    return violations;
  };

  const checkDiffusionRules = () => {
    const violations = [];
    layers.forEach((layer) => {
      if (layer.type === "n_diffusion" || layer.type === "p_diffusion") {
        // Check minimum size
        if (
          layer.width < DESIGN_RULES.DIFF_MIN_SIZE ||
          layer.height < DESIGN_RULES.DIFF_MIN_SIZE
        ) {
          violations.push({
            type: "diffusion",
            layers: [layer.id],
            message: `Diffusion ${layer.id} violates minimum size rule (${DESIGN_RULES.DIFF_MIN_SIZE}λ x ${DESIGN_RULES.DIFF_MIN_SIZE}λ)`,
          });
        }

        // Check spacing to wells and substrate
        layers.forEach((otherLayer) => {
          if (otherLayer.type === "n_well") {
            const spacing = getLayerSpacing(layer, otherLayer);
            if (spacing < DESIGN_RULES.DIFF_TO_WELL_SPACING) {
              violations.push({
                type: "diffusion",
                layers: [layer.id, otherLayer.id],
                message: `Diffusion ${layer.id} and N-well ${otherLayer.id} violate minimum spacing rule (${DESIGN_RULES.DIFF_TO_WELL_SPACING}λ)`,
              });
            }
          }
        });
      }
    });

    return violations;
  };

  const checkPolyRules = () => {
    const violations = [];
    layers.forEach((layer) => {
      if (layer.type === "poly") {
        // Check minimum width
        if (
          layer.width < DESIGN_RULES.POLY_MIN_WIDTH ||
          layer.height < DESIGN_RULES.POLY_MIN_WIDTH
        ) {
          violations.push({
            type: "poly",
            layers: [layer.id],
            message: `Poly ${layer.id} violates minimum width rule (${DESIGN_RULES.POLY_MIN_WIDTH}λ)`,
          });
        }

        // Check poly overhang over diffusion
        layers.forEach((diffLayer) => {
          if (
            diffLayer.type === "diffusion" &&
            doLayersOverlap(layer, diffLayer)
          ) {
            const overhang = Math.min(
              layer.x - diffLayer.x,
              diffLayer.x + diffLayer.width - (layer.x + layer.width)
            );
            if (overhang < DESIGN_RULES.POLY_OVERHANG) {
              violations.push({
                type: "poly",
                layers: [layer.id, diffLayer.id],
                message: `Poly ${layer.id} overhang over diffusion ${diffLayer.id} violates minimum rule (${DESIGN_RULES.POLY_OVERHANG}λ)`,
              });
            }
          }
        });
      }
    });

    return violations;
  };

  const checkMetal1Rules = () => {
    const violations = [];
    layers.forEach((layer) => {
      if (layer.type === "metal1") {
        // Check minimum size
        if (
          layer.width < DESIGN_RULES.METAL1_MIN_SIZE ||
          layer.height < DESIGN_RULES.METAL1_MIN_SIZE
        ) {
          violations.push({
            type: "metal1",
            layers: [layer.id],
            message: `Metal1 ${layer.id} violates minimum size rule (${DESIGN_RULES.METAL1_MIN_SIZE}λ x ${DESIGN_RULES.METAL1_MIN_SIZE}λ)`,
          });
        }

        // Check spacing to other metal1 layers
        layers.forEach((otherLayer) => {
          if (otherLayer.type === "metal1" && layer.id !== otherLayer.id) {
            const spacing = getLayerSpacing(layer, otherLayer);
            if (spacing < DESIGN_RULES.METAL1_SPACING) {
              violations.push({
                type: "metal1",
                layers: [layer.id, otherLayer.id],
                message: `Metal1 ${layer.id} and ${otherLayer.id} violate minimum spacing rule (${DESIGN_RULES.METAL1_SPACING}λ)`,
              });
            }
          }
        });
      }
    });

    return violations;
  };

  const checkContactRules = () => {
    const violations = [];
    // Implementation for contact rules
    // This would check contact sizes and spacing
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
    const wellViolations = checkWellRules();
    const diffusionViolations = checkDiffusionRules();
    const polyViolations = checkPolyRules();
    const metal1Violations = checkMetal1Rules();
    const contactViolations = checkContactRules();

    return [
      ...wellViolations,
      ...diffusionViolations,
      ...polyViolations,
      ...metal1Violations,
      ...contactViolations,
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
