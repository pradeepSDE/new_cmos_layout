import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const LayoutList = () => {
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLayouts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/layouts", {
          withCredentials: true,
        });
        setLayouts(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching layouts:", error);
        setLoading(false);
      }
    };

    fetchLayouts();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/layouts/${id}`, {
        withCredentials: true,
      });
      setLayouts(layouts.filter((layout) => layout._id !== id));
    } catch (error) {
      console.error("Error deleting layout:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="layout-list">
      <h1>Saved Layouts</h1>
      <Link to="/layouts/new" className="create-button">
        Create New Layout
      </Link>
      <div className="layouts-grid">
        {layouts.map((layout) => (
          <div key={layout._id} className="layout-card">
            <h3>{layout.name}</h3>
            <p>{layout.description}</p>
            <div className="layout-actions">
              <Link to={`/layouts/${layout._id}`} className="edit-button">
                Edit
              </Link>
              <button
                onClick={() => handleDelete(layout._id)}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayoutList;
