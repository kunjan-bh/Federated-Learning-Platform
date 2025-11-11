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
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CentralAuthIteration = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [iterationName, setIterationName] = useState(""); // Added iterationName
  const [modelName, setModelName] = useState("");
  const [datasetDomain, setDatasetDomain] = useState("");
  const [version, setVersion] = useState(1);
  const [modelFile, setModelFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedIteration, setSelectedIteration] = useState(null);

  
  

  const navigate = useNavigate();
  const backendBase = "http://127.0.0.1:8000"; // change for production

  const navItems = [
    { name: "Dashboard", icon: <FaChartLine />, path: "/dashboard" },
    { name: "Models", icon: <FaDatabase />, path: "/centralAuthModels" },
    { name: "Current Iteration", icon: <FaSyncAlt />, path: "/centralAuthIteration" },
  ];

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchIterationClients = async (iterationId) => {
    try {
      const { data } = await axios.get(`${backendBase}/central-models/${iterationId}/clients/`);
      setClients(data);
      const iteration = models.find((m) => m.id === iterationId);
      setSelectedIteration(iteration);
      setShowClientsModal(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch assigned clients.");
    }
  };
  
  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) throw new Error("User not found in localStorage");

      const user = JSON.parse(storedUser);
      const { data } = await axios.get(`${backendBase}/central-models/`, {
        params: { user_id: user.id },
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

  const handleFileChange = (e) => setModelFile(e.target.files[0]);

  const resetForm = () => {
    setIterationName("");
    setModelName("");
    setDatasetDomain("");
    setVersion(1);
    setModelFile(null);
    setShowForm(false);
    setEditForm(false);
    setEditId(null);
  };

  const openEditForm = (iteration) => {
    setEditForm(true);
    setShowForm(false);
    setIterationName(iteration.iteration_name || ""); // pre-fill iteration name
    setModelName(iteration.model_name || "");
    setDatasetDomain(iteration.dataset_domain || "");
    setVersion(Number(iteration.version) || 1);
    setModelFile(null);
    setEditId(iteration.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!iterationName || !modelName || !datasetDomain || (!modelFile && !editForm)) {
      toast.warning(
        "Please fill iteration name, model name and dataset domain. If creating, upload a model file."
      );
      return;
    }

    setSubmitting(true);
    const user = JSON.parse(localStorage.getItem("user"));
    const formData = new FormData();
    formData.append("central_auth", user.id);
    formData.append("iteration_name", iterationName); // include iteration name
    formData.append("model_name", modelName);
    formData.append("dataset_domain", datasetDomain);
    formData.append("version", version);

    if (modelFile) formData.append("model_file", modelFile);

    try {
      if (editForm && editId) {
        await axios.patch(`${backendBase}/central-models/${editId}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(
          version === 0
            ? "Iteration marked as final (version 0)."
            : "Iteration updated successfully!"
        );
      } else {
        await axios.post(`${backendBase}/central-models/start/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Iteration started successfully!");
      }

      await fetchModels();
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit. Check console for details.");
    } finally {
      setSubmitting(false);
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

  const runningIterations = models
    .filter((m) => Number(m.version) > 0)
    .sort((a, b) => b.version - a.version);

  const finalIterations = models
    .filter((m) => Number(m.version) === 0)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
          <h1>Central Auth — Iterations</h1>
          <p className="muted">
            Manage current and previous federated-learning iterations
          </p>
        </header>

        {/* Summary Row */}
        <section className="summary-row">
          {/* <div className="card1 small">
            <h3>Final model (version 0)</h3>
            {finalIterations.length > 0 ? (
              <div>
                <strong>{finalIterations[0].iteration_name}</strong>
                <div className="muted">Model: {finalIterations[0].model_name}</div>
                <div className="muted">Domain: {finalIterations[0].dataset_domain}</div>
                <div className="muted">
                  Uploaded: {new Date(finalIterations[0].created_at).toLocaleString()}
                </div>
                <div className="muted">By: {finalIterations[0].central_auth_email}</div>
                {finalIterations[0].model_file && (
                  <button
                    className="iteration-download-btn"
                    onClick={() => handleDownload(finalIterations[0].model_file)}
                  >
                    <FaDownload /> Download Model
                  </button>
                )}
              </div>
            ) : (
              <div className="muted">No final model yet</div>
            )}
          </div> */}

          <div className="card1 small">
            <h3>Running iterations</h3>
            <div className="muted">{runningIterations.length} active</div>
            {runningIterations[0] ? (
              <div>
                <strong>
                  {runningIterations[0].iteration_name} ({runningIterations[0].model_name} v
                  {runningIterations[0].version})
                </strong>
                <div className="muted">Domain: {runningIterations[0].dataset_domain}</div>
              </div>
            ) : (
              <div className="muted">No current iterations</div>
            )}
          </div>

          <div className="card1 small">
            <h3>Actions</h3>
            <div>
              <button className="btn" onClick={() => setShowForm((s) => !s)}>
                {showForm ? "Close start form" : "Start new iteration"}
              </button>
              <button className="btn ghost" onClick={fetchModels} style={{ marginLeft: 8 }}>
                Refresh
              </button>
            </div>
          </div>
        </section>

        {/* Create / Edit Form */}
        {(showForm || editForm) && (
          <section className="card1 form-card1">
            <h2>{editForm ? "Update iteration" : "Start new iteration"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>Iteration Name</label>
                <input
                  value={iterationName}
                  onChange={(e) => setIterationName(e.target.value)}
                  placeholder="e.g. Iteration_01"
                />
                <small className="muted">Must be unique for each iteration</small>
              </div>
              <div className="form-row">
                <label>Model Name</label>
                <input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. ResNet50_federated"
                />
              </div>
              <div className="form-row">
                <label>Dataset Domain</label>
                <input
                  value={datasetDomain}
                  onChange={(e) => setDatasetDomain(e.target.value)}
                  placeholder="e.g. chest-xray, ehr"
                />
              </div>
              <div className="form-row">
                <label htmlFor="version">Version (integer)</label>
                <input
                  type="number"
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(Number(e.target.value))}
                  min={0}
                  step={1}
                />
                <small className="muted">Set version 0 to mark this iteration as final.</small>
              </div>
              <div className="form-row">
                <label>Model file (.pkl)</label>
                <input type="file" accept=".pkl,.joblib" onChange={handleFileChange} />
                {modelFile && <div className="muted small">Selected: {modelFile.name}</div>}
              </div>
              <div className="form-actions">
                <button type="submit" className="btn primary" disabled={submitting}>
                  {submitting ? "Submitting…" : editForm ? "Update" : "Start Iteration"}
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Current Iterations */}
        <section className="card1 list-card1">
          <h2>Current Iterations</h2>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : runningIterations.length === 0 ? (
            <div className="empty">
              No active iterations right now. Would you like to start one?
              <div style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => setShowForm(true)}>
                  Yes, start one
                </button>
              </div>
            </div>
          ) : (
            <ul className="iteration-list">
              {runningIterations.map((m) => (
                <li key={m.id} className="iteration-item">
                  <div className="iteration-left">
                    <strong>{m.iteration_name}</strong>
                    <div className="muted">
                      {m.model_name} (v{m.version}) • {m.dataset_domain || "—"}
                    </div>
                  </div>
                  <div className="iteration-right">
                    <div className="muted small">By: {m.central_auth_email}</div>
                    <div className="muted small">
                      Uploaded: {new Date(m.created_at).toLocaleString()}
                    </div>
                    {m.model_file && (
                      <button
                        className="iteration-download-btn"
                        onClick={() => handleDownload(m.model_file)}
                      >
                        <FaDownload /> Download
                      </button>
                    )}
                    <button className="iteration-view-btn" onClick={() => fetchIterationClients(m.id)}>
                      View Clients
                    </button>
                    <button className="iteration-edit-btn" onClick={() => openEditForm(m)}>
                      Update
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Final / Previous Iterations */}
        <section className="card1 list-card1">
          <h2>Previous / Final Iterations</h2>
          {loading ? (
            <div>Loading...</div>
          ) : finalIterations.length === 0 ? (
            <div className="muted">No final or completed iterations yet.</div>
          ) : (
            <ul className="iteration-list simple">
              {finalIterations.map((m) => (
                <li key={m.id} className="iteration-item small">
                  <div>
                    <strong>{m.iteration_name}</strong>
                    <div className="muted small">
                      {m.model_name} (v{m.version}) • {m.dataset_domain || "—"}
                    </div>
                  </div>
                  <div className="muted small">
                    By: {m.central_auth_email} — {new Date(m.created_at).toLocaleString()}
                  </div>
                  {m.model_file && (
                    <button
                      className="iteration-download-btn"
                      onClick={() => handleDownload(m.model_file)}
                    >
                      <FaDownload /> Download
                    </button>
                    
                  )}
                  <button className="iteration-view-btn" onClick={() => fetchIterationClients(m.id)}>
                    View Clients
                  </button>

                </li>
              ))}
            </ul>
          )}
        </section>
        {showClientsModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Assigned Clients</h2>
              <p className="muted">
                {selectedIteration?.iteration_name} — {selectedIteration?.model_name}
              </p>

              {clients.length === 0 ? (
                <div className="muted">No clients assigned for this iteration.</div>
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

export default CentralAuthIteration;
