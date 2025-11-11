import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSignOutAlt, FaDownload, FaChartLine, FaDatabase, FaSyncAlt, FaCogs } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const SendUpdate = () => {
  const [iterations, setIterations] = useState([]);
  const [selectedIteration, setSelectedIteration] = useState(null);
  const [formData, setFormData] = useState({
    accuracy: "",
    precision: "",
    recall: "",
    f1_score: "",
    version: "",
    model_file: null,
  });

  const navigate = useNavigate();
  const backendBase = "http://127.0.0.1:8000";
  const user = JSON.parse(localStorage.getItem("user"));

  const navItems = [
    { name: "Dashboard", icon: <FaChartLine />, path: "/dashboardClient" },
    { name: "Send Updates", icon: <FaDatabase />, path: "/sendUpdates" },
    { name: "Iterations", icon: <FaSyncAlt />, path: "/clientIterations" },
  ];

  useEffect(() => {
    if (user) fetchCurrentIterations();
  }, [user]);

  const fetchCurrentIterations = async () => {
    try {
      const res = await axios.get(
        `${backendBase}/client/current-iterations/${user.email}/`
      );
      setIterations(res.data);
    } catch (err) {
      console.error("Error fetching iterations:", err);
      toast.error("Failed to fetch current iterations.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIteration) return toast.warn("Select an iteration first");

    const submission = new FormData();
    submission.append("assignment", selectedIteration.assignment_id);
    submission.append("accuracy", formData.accuracy);
    submission.append("precision", formData.precision);
    submission.append("recall", formData.recall);
    submission.append("f1_score", formData.f1_score);
    submission.append("version", selectedIteration.version);
    submission.append("model_file", formData.model_file);

    try {
      await axios.post(`${backendBase}/client/submit-model/`, submission, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("✅ Model submitted successfully!");
      setFormData({ accuracy: "", precision: "", recall: "", f1_score: "", version: "", model_file: null });
      setSelectedIteration(null);
      fetchCurrentIterations();
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("❌ Failed to submit model");
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
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Sidebar: exact same as ClientIterations */}
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
        <header className="page-header">
          <h1>Send Updates</h1>
          <p className="muted">Submit your model updates for the assigned iterations</p>
        </header>

        {iterations.length === 0 ? (
          <div className="muted">No active iterations assigned to you.</div>
        ) : (
          <ul className="iteration-list">
            {iterations.map((it) => (
              <li key={it.assignment_id} className="iteration-item">
                <div>
                  <strong>{it.iteration_name}</strong> - {it.model_name} <br />
                  Version: {it.version} <br />
                  Domain: {it.data_domain || it.dataset_domain} <br />
                  Central Auth: {it.central_auth_email}
                </div>
                <div>
                  {it.model_file && (
                    <button className="iteration-download-btn" onClick={() => handleDownload(it.model_file)}>
                      <FaDownload /> Download
                    </button>
                  )}
                  <button className="select-btn" onClick={() => setSelectedIteration(it)}>
                    Submit Updates
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Submission Form */}
        {selectedIteration && (
          <div className="assessment-form">
            <h3>Submit Model for {selectedIteration.model_name}</h3>
            <form onSubmit={handleSubmit}>
              {["accuracy", "precision", "recall", "f1_score"].map((f) => (
                <div className="input-group" key={f}>
                  <label>{f.toUpperCase()}:</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData[f]}
                    onChange={(e) => setFormData({ ...formData, [f]: e.target.value })}
                  />
                </div>
              ))}

              <div className="input-group">
                <label>Upload Model File:</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setFormData({ ...formData, model_file: e.target.files[0] })}
                />
              </div>

              <button type="submit" className="submit-btn">
                Submit Model
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default SendUpdate;
