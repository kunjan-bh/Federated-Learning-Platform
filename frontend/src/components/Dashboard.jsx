import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaCogs,
  FaDatabase,
  FaSyncAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import axios from "axios";
import FetchClients from "./FetchClients";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const backendBase = "http://127.0.0.1:8000";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login"); 
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.role === "central") fetchModels(parsedUser.id);
    }
  }, [navigate]);

  const fetchModels = async (centralAuthId) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendBase}/central-models/`, {
        params: { user_id: centralAuthId },
      });
      setModels(data);
    } catch (err) {
      console.error("Failed to fetch models", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", icon: <FaChartLine />, path: "/dashboard" },
    { name: "Models", icon: <FaDatabase />, path: "/centralAuthModels" },
    { name: "Current Iteration", icon: <FaSyncAlt />, path: "/centralAuthIteration" },
    { name: "Settings", icon: <FaCogs />, path: "/settings" },
  ];

  if (!user) return null; 

  // Calculating the dynamic values
  const currentRunningRounds = models.filter(m => Number(m.version) > 0).length;
  const totalRounds = models.length; 
  const totalFinalizedModels = models.filter(m => Number(m.version) === 0).length;

  return (
    <div className="dashboard-container1">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/logo.png" alt="Logo" className="logo" />
            <h1 className="logo-text">euroNode</h1>
          </div>
        </div>

        <nav className="nav-links">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              className="nav-item"
              onClick={() => navigate(item.path)}
            >
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

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            {user.role !== "central" && (
              <p className="hospital-name">🏥 {user.hospital}</p>
            )}
            <h2>
              {user.role === "central"
                ? "Central Authority Dashboard"
                : "Client Dashboard"}
            </h2>
            <span className="role">Role: {user.role}</span>
          </div>
        </div>

        <div className="cards-container">
          <div className="card">
            <h3>Current Running Rounds</h3>
            <p className="card-value blue">{loading ? "…" : currentRunningRounds}</p>
          </div>
          <div className="card">
            <h3>Total Rounds</h3>
            <p className="card-value green">{loading ? "…" : totalRounds}</p>
          </div>
          <div className="card">
            <h3>Total Finalized Models</h3>
            <p className="card-value orange">{loading ? "…" : totalFinalizedModels}</p>
          </div>
        </div>

        {user.role === "central" && (
          <FetchClients centralAuthId={user.id} email={user.email} />
        )}

        <div className="analytics-section">
          <h3>Analysis Overview</h3>
          <p>
            Graphs, charts, and performance metrics will appear here once data
            is integrated.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
