import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaChartLine, FaDatabase, FaSyncAlt, FaCogs, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CentralAuthIteration = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [modelName, setModelName] = useState("");
  const [datasetDomain, setDatasetDomain] = useState("");
  const [version, setVersion] = useState(1);
  const [modelFile, setModelFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", icon: <FaChartLine />, path: "/dashboard" },
    { name: "Models", icon: <FaDatabase />, path: "/models" },
    { name: "Current Iteration", icon: <FaSyncAlt />, path: "/iterations" },
    { name: "Settings", icon: <FaCogs />, path: "/settings" },
  ];

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) throw new Error("User not found in localStorage");
  
      const user = JSON.parse(storedUser);
  
      // Pass user_id as query param
      const { data } = await axios.get("http://127.0.0.1:8000/central-models/", {
        params: { user_id: user.id }
      });
  
      setModels(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load models.");
      toast.error("Failed to load models");
    } finally {
      setLoading(false);
    }
  };
  

  const runningIterations = models.filter(m => m.version && m.version > 0).sort((a, b) => b.version - a.version);
  const finalModel = models.find(m => Number(m.version) === 0);

  const handleFileChange = (e) => setModelFile(e.target.files[0]);

  const resetForm = () => {
    setModelName("");
    setDatasetDomain("");
    setVersion(1);
    setModelFile(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modelName || !datasetDomain || !modelFile) {
      toast.warning("Please fill all fields and upload a model file (.pkl)");
      return;
    }
    setSubmitting(true);
    const user = JSON.parse(localStorage.getItem("user"))
    const formData = new FormData();
    formData.append("central_auth", user.id); // Add this
    formData.append("model_name", modelName);
    formData.append("dataset_domain", datasetDomain);
    formData.append("version", version);
    formData.append("model_file", modelFile);

    try {
      await axios.post("http://127.0.0.1:8000/central-models/start/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchModels();
      resetForm();
      toast.success("Iteration started successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to start iteration. Check console for details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="page-layout">
      {/* --- Sidebar Inline --- */}
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

      {/* --- Main Content --- */}
      <main className="main-container">
        <ToastContainer position="top-right" autoClose={3000} />
        <header className="page-header">
          <h1>Central Auth — Iterations</h1>
          <p className="muted">Manage current and previous federated-learning iterations</p>
        </header>

        <section className="summary-row">
          <div className="card1 small">
            <h3>Final model (version 0)</h3>
            {finalModel ? (
              <div>
                <strong>{finalModel.model_name}</strong>
                <div className="muted">Domain: {finalModel.dataset_domain || "—"}</div>
                <div className="muted">Uploaded: {new Date(finalModel.created_at).toLocaleString()}</div>
                <div className="muted">By: {finalModel.central_auth_email}</div>
              </div>
            ) : <div className="muted">No final model yet</div>}
          </div>

          <div className="card1 small">
            <h3>Running iterations</h3>
            <div className="muted">{runningIterations.length} active</div>
            {runningIterations[0] ? (
              <div>
                <strong>{runningIterations[0].model_name} (v{runningIterations[0].version})</strong>
                <div className="muted">Domain: {runningIterations[0].dataset_domain}</div>
              </div>
            ) : (
              <div className="muted">No current iterations</div>
            )}
          </div>

          <div className="card1 small">
            <h3>Actions</h3>
            <div>
              <button className="btn" onClick={() => setShowForm(s => !s)}>
                {showForm ? "Close start form" : "Start new iteration"}
              </button>
              <button className="btn ghost" onClick={fetchModels} style={{ marginLeft: 8 }}>
                Refresh
              </button>
            </div>
          </div>
        </section>

        {showForm && (
          <section className="card1 form-card1">
            <h2>Start new iteration</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>Model Name</label>
                <input
                  value={modelName}
                  onChange={e => setModelName(e.target.value)}
                  placeholder="e.g. ResNet50_federated"
                />
              </div>
              <div className="form-row">
                <label>Dataset Domain</label>
                <input
                  value={datasetDomain}
                  onChange={e => setDatasetDomain(e.target.value)}
                  placeholder="e.g. chest-xray, ehr"
                />
              </div>
              <div className="form-row">
                <label htmlFor="version">Version (integer)</label>
                <input
                    type="number"
                    id="version"
                    value={version}
                    onChange={e => setVersion(Number(e.target.value))}
                    min={1}         // optional: minimum version
                    step={1}        // ensures only integers
                    placeholder="Enter version number"
                    className="version-input"
                />
              </div>
              <div className="form-row">
                <label>Model file (.pkl)</label>
                <input type="file" accept=".pkl,.joblib" onChange={handleFileChange} />
                {modelFile && <div className="muted small">Selected: {modelFile.name}</div>}
              </div>
              <div className="form-actions">
                <button type="submit" className="btn primary" disabled={submitting}>
                  {submitting ? "Submitting…" : "Start Iteration"}
                </button>
                <button type="button" className="btn ghost" onClick={resetForm} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="card1 list-card1">
          <h2>Current Iterations</h2>
          {loading ? <div>Loading...</div> :
           error ? <div className="error">{error}</div> :
           runningIterations.length === 0 ? (
            <div className="empty">
              No active iterations right now. Would you like to start one?
              <div style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => setShowForm(true)}>Yes, start one</button>
              </div>
            </div>
           ) : (
            <ul className="iteration-list">
              {runningIterations.map(m => (
                <li key={m.id} className="iteration-item">
                  <div className="iteration-left">
                    <strong>{m.model_name}</strong>
                    <div className="muted">v{m.version} • {m.dataset_domain || "—"}</div>
                  </div>
                  <div className="iteration-right">
                    <div className="muted small">By: {m.central_auth_email}</div>
                    <div className="muted small">Uploaded: {new Date(m.created_at).toLocaleString()}</div>
                  </div>
                </li>
              ))}
            </ul>
           )
          }
        </section>

        <section className="card1 list-card1">
          <h2>Previous / Final Iterations</h2>
          {loading ? <div>Loading...</div> :
            models.length === 0 ? <div className="muted">No iterations recorded yet.</div> :
            <ul className="iteration-list simple">
              {models.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
                .map(m => (
                  <li key={m.id} className="iteration-item small">
                    <div>
                      <strong>{m.model_name}</strong>
                      <div className="muted small">v{m.version} • {m.dataset_domain || "—"}</div>
                    </div>
                    <div className="muted small">By: {m.central_auth_email} — {new Date(m.created_at).toLocaleString()}</div>
                  </li>
              ))}
            </ul>
          }
        </section>
      </main>
    </div>
  );
};

export default CentralAuthIteration;
