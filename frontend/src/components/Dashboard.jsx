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

// Recharts
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

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
  ];

  if (!user) return null;

  // Dynamic values
  const currentRunningRounds = models.filter((m) => Number(m.version) > 0).length;
  const totalRounds = models.length;
  const totalFinalizedModels = models.filter((m) => Number(m.version) === 0).length;

  // Pie chart data
  const pieData = [
    { name: "Running Iterations", value: currentRunningRounds },
    { name: "Finalized Models", value: totalFinalizedModels },
  ];
  const COLORS = ["#0088FE", "#FFBB28"];

  // Bar chart data
  const barData = models.map((m) => ({
    model: m.model_name || m.id,
    running: Number(m.version) > 0 ? 1 : 0,
    finalized: Number(m.version) === 0 ? 1 : 0,
  }));

  // Line chart data
  const lineData = models
    .sort((a, b) => a.version - b.version)
    .map((m, idx) => ({
      iteration: m.iteration_name || `Iter ${idx + 1}`,
      version: m.version,
    }));

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

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            {user.role !== "central" && <p className="hospital-name">🏥 {user.hospital}</p>}
            <h2>{user.role === "central" ? "Central Authority Dashboard" : "Client Dashboard"}</h2>
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

        {user.role === "central" && <FetchClients centralAuthId={user.id} email={user.email} />}

        <div className="analytics-section">
          <h3>Analysis Overview</h3>

          {/* Pie Chart */}
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
            <p>This chart shows running iterations vs finalized models.</p>
          </div>

          {/* Bar Chart */}
          <div style={{ width: "100%", height: 300, marginTop: 30 }}>
            <h4>Models Status (Bar Chart)</h4>
            <ResponsiveContainer>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="model" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="running" fill="#0088FE" name="Running Rounds" />
                <Bar dataKey="finalized" fill="#FFBB28" name="Finalized Models" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart */}
          <div style={{ width: "100%", height: 300, marginTop: 30 }}>
            <h4>Iteration Versions Over Time</h4>
            <ResponsiveContainer>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="iteration" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="version" stroke="#82ca9d" name="Version" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
