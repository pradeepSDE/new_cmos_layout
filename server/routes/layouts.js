const express = require("express");
const router = express.Router();
const Layout = require("../models/Layout");
const authenticateJWT = require("../src/midldlewares/authenticateJWT");

// Get all layouts for the authenticated user
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const layouts = await Layout.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(layouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single layout (only if it belongs to the authenticated user)
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const layout = await Layout.findOne({ 
      _id: req.params.id,
      user: req.user._id 
    });
    
    if (!layout) {
      return res.status(404).json({ message: "Layout not found" });
    }
    res.json(layout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new layout (associated with the authenticated user)
router.post("/", authenticateJWT, async (req, res) => {
  const layout = new Layout({
    name: req.body.name,
    description: req.body.description,
    layoutData: req.body.layoutData,
    user: req.user.id
  });

  try {
    const newLayout = await layout.save();
    res.status(201).json(newLayout);
  } catch (error) {
    res.status(400).json({ message: error.message, code:"fuckedup" });
  }
});

// Update a layout (only if it belongs to the authenticated user)
router.put("/:id", authenticateJWT, async (req, res) => {
  try {
    const layout = await Layout.findOne({ 
      _id: req.params.id,
      user: req.user._id 
    });
    
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

// Delete a layout (only if it belongs to the authenticated user)
router.delete("/:id", authenticateJWT, async (req, res) => {
  try {
    const layout = await Layout.findOne({ 
      _id: req.params.id,
      user: req.user._id 
    });
    
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
