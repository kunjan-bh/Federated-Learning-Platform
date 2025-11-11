import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaChartLine, FaDatabase, FaSyncAlt, FaCogs, FaSignOutAlt, FaDownload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ClientIterations = () => {
  const [iterations, setIterations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const backendBase = "http://127.0.0.1:8000"; // backend base URL

  const navItems = [
    { name: "Dashboard", icon: <FaChartLine />, path: "/dashboardClient" },
    { name: "Send Updates", icon: <FaDatabase />, path: "/sendUpdates" },
    { name: "Iterations", icon: <FaSyncAlt />, path: "/clientIterations" },
  ];

  useEffect(() => {
    fetchIterations();
  }, []);

  const fetchIterations = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) throw new Error("User not found in localStorage");

      const { data } = await axios.get(`${backendBase}/client-models/`, {
        params: { user_id: user.id },
      });

      setIterations(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch iterations.");
      toast.error("Failed to fetch iterations.");
    } finally {
      setLoading(false);
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

  const runningIterations = iterations
    .filter((m) => Number(m.version) > 0)
    .sort((a, b) => b.version - a.version);

  const finishedIterations = iterations
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

      {/* Main Section */}
      <main className="main-container">
        <ToastContainer position="top-right" autoClose={3000} />

        <header className="page-header">
          <h1>Client Iterations</h1>
          <p className="muted">
            View current and completed iterations assigned to your client
          </p>
        </header>

        {/* Summary Row */}
        <section className="summary-row">
          <div className="card1 small">
            <h3>Active Iterations</h3>
            <div className="muted">{runningIterations.length} currently active</div>
            {runningIterations[0] ? (
              <div>
                <strong>
                  {runningIterations[0].iteration_name} ({runningIterations[0].model_name} v
                  {runningIterations[0].version})
                </strong>
                <div className="muted">Domain: {runningIterations[0].dataset_domain}</div>
              </div>
            ) : (
              <div className="muted">No active iterations</div>
            )}
          </div>

          <div className="card1 small">
            <h3>Completed Iterations</h3>
            <div className="muted">{finishedIterations.length} finalized</div>
          </div>

          <div className="card1 small">
            <h3>Actions</h3>
            <button className="btn ghost" onClick={fetchIterations}>
              Refresh
            </button>
          </div>
        </section>

        {/* Current Iterations */}
        <section className="card1 list-card1">
          <h2>Current Iterations</h2>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : runningIterations.length === 0 ? (
            <div className="muted">No current running iterations.</div>
          ) : (
            <ul className="iteration-list">
              {runningIterations.map((m) => (
                <li key={m.id} className="iteration-item">
                  <div className="iteration-left">
                    <strong>{m.iteration_name}</strong>
                    <div className="muted">
                      {m.model_name} (v{m.version}) • {m.dataset_domain || "—"}
                    </div>
                    <div className="muted small">
                      Uploaded: {new Date(m.created_at).toLocaleString()}
                    </div>
                    <div className="muted small">
                      Central Auth: {m.central_auth_email}
                    </div>
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
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Completed Iterations */}
        <section className="card1 list-card1">
          <h2>Completed Iterations</h2>
          {loading ? (
            <div>Loading...</div>
          ) : finishedIterations.length === 0 ? (
            <div className="muted">No completed iterations yet.</div>
          ) : (
            <ul className="iteration-list simple">
              {finishedIterations.map((m) => (
                <li key={m.id} className="iteration-item small">
                  <div>
                    <strong>{m.iteration_name}</strong>
                    <div className="muted small">
                      {m.model_name} (v{m.version}) • {m.dataset_domain || "—"}
                    </div>
                    <div className="muted small">
                      Uploaded: {new Date(m.created_at).toLocaleString()}
                    </div>
                    <div className="muted small">
                      Central Auth: {m.central_auth_email}
                    </div>
                  </div>
                  {m.model_file && (
                    <button
                      className="iteration-download-btn"
                      onClick={() => handleDownload(m.model_file)}
                    >
                      <FaDownload /> Download
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default ClientIterations;
