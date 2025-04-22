const express = require("express");
const router = express.Router();
const Layout = require("../models/Layout");

// Get all layouts
router.get("/", async (req, res) => {
  try {
    const layouts = await Layout.find().sort({ createdAt: -1 });
    res.json(layouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single layout
router.get("/:id", async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) {
      return res.status(404).json({ message: "Layout not found" });
    }
    res.json(layout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new layout
router.post("/", async (req, res) => {
  const layout = new Layout({
    name: req.body.name,
    description: req.body.description,
    layoutData: req.body.layoutData,
  });

  try {
    const newLayout = await layout.save();
    res.status(201).json(newLayout);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a layout
router.put("/:id", async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) {
      return res.status(404).json({ message: "Layout not found" });
    }

    layout.name = req.body.name || layout.name;
    layout.description = req.body.description || layout.description;
    layout.layoutData = req.body.layoutData || layout.layoutData;
    layout.updatedAt = Date.now();

    const updatedLayout = await layout.save();
    res.json(updatedLayout);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a layout
router.delete("/:id", async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) {
      return res.status(404).json({ message: "Layout not found" });
    }

    await layout.remove();
    res.json({ message: "Layout deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
