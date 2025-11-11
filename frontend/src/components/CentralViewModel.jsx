import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaChartLine,
  FaDatabase,
  FaSyncAlt,
  FaCogs,
  FaSignOutAlt,
  FaDownload,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CentralViewModel = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [showClientsModal, setShowClientsModal] = useState(false);

  const backendBase = "http://127.0.0.1:8000"; // adjust for production
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", icon: <FaChartLine />, path: "/dashboard" },
    { name: "Models", icon: <FaDatabase />, path: "/centralAuthModels" },
    { name: "Current Iteration", icon: <FaSyncAlt />, path: "/centralAuthIteration" },
  ];

  useEffect(() => {
    fetchFinalModels();
  }, []);

  const fetchFinalModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) throw new Error("User not found in localStorage");
      const user = JSON.parse(storedUser);
      const { data } = await axios.get(`${backendBase}/central-models/`, {
        params: { user_id: user.id },
      });

      // Filter for finalized models (version === 0)
      const finals = data.filter((m) => Number(m.version) === 0);
      setModels(finals);
    } catch (err) {
      console.error(err);
      setError("Failed to load finalized models.");
      toast.error("Failed to load finalized models.");
    } finally {
      setLoading(false);
    }
  };

  const fetchModelClients = async (modelId) => {
    try {
      const { data } = await axios.get(`${backendBase}/central-models/${modelId}/clients/`);
      setClients(data);
      const model = models.find((m) => m.id === modelId);
      setSelectedModel(model);
      setShowClientsModal(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch model clients.");
    }
  };

  const handleDownload = (filePath) => {
    if (!filePath) return;
    const url = filePath.startsWith("http") ? filePath : `${backendBase}${filePath}`;
    window.open(url, "_blank");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="page-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/logo.png" alt="Logo" className="logo" />
            <h1 className="logo-text">euroNode</h1>
          </div>
        </div>

        <nav className="nav-links">
          {navItems.map((item, idx) => (
            <button key={idx} className="nav-item" onClick={() => navigate(item.path)}>
              <span className="icon">{item.icon}</span>
              <span className="label">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="logout-section">
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-container">
        <ToastContainer position="top-right" autoClose={3000} />

        <header className="page-header">
          <h1>Finalized Models</h1>
          <p className="muted">View all finalized federated models (version 0)</p>
        </header>

        {/* Finalized Models Section */}
        <section className="card1 list-card1">
          <h2>Final Models</h2>
          {loading ? (
            <div>Loading finalized models...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : models.length === 0 ? (
            <div className="empty-premium">
              <img src="/no-models.svg" alt="No Models" className="empty-image" />
              <h3>No finalized models yet</h3>
              <p className="muted">Once a model iteration reaches version 0, it will appear here.</p>
            </div>
          ) : (
            <ul className="iteration-list">
              {models.map((m) => (
                <li key={m.id} className="iteration-item">
                  <div className="iteration-left">
                    <strong>{m.iteration_name}</strong>
                    <div className="muted">
                      {m.model_name} (v{m.version}) • {m.dataset_domain || "—"}
                    </div>
                    <div className="muted small">
                      Uploaded: {new Date(m.created_at).toLocaleString()}
                    </div>
                    <div className="muted small">By: {m.central_auth_email}</div>
                  </div>
                  <div className="iteration-right">
                    {m.model_file && (
                      <button
                        className="iteration-download-btn"
                        onClick={() => handleDownload(m.model_file)}
                      >
                        <FaDownload /> Download Model
                      </button>
                    )}
                    <button
                      className="iteration-view-btn"
                      onClick={() => fetchModelClients(m.id)}
                    >
                      <FaUsers /> View Clients
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Clients Modal */}
        {showClientsModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Clients involved</h2>
              <p className="muted">
                {selectedModel?.iteration_name} — {selectedModel?.model_name}
              </p>

              {clients.length === 0 ? (
                <div className="muted">No clients contributed to this model.</div>
              ) : (
                <table className="client-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Hospital</th>
                      <th>Data Domain</th>
                      <th>Assigned At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c, i) => (
                      <tr key={i}>
                        <td>{c.client_email}</td>
                        <td>{c.client_hospital || "—"}</td>
                        <td>{c.data_domain}</td>
                        <td>{new Date(c.assigned_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <button className="btn ghost" onClick={() => setShowClientsModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CentralViewModel;
