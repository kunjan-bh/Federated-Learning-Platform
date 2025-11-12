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

// Recharts
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DashboardClient = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    current_running_rounds: 0,
    total_rounds: 0,
    total_finalized_models: 0,
    completed_percentage: 0, // new metric for analysis
    pending_percentage: 0,   // new metric for analysis
  });
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
      if (parsedUser.role === "client") {
        fetchClientDashboard(parsedUser.email);
      }
    }
  }, [navigate]);

  const fetchClientDashboard = async (email) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendBase}/client-dashboard-data/${email}/`);
      // calculate percentages for chart
      const total = data.total_rounds || 1; // avoid division by zero
      setStats({
        ...data,
        completed_percentage: ((data.total_finalized_models / total) * 100).toFixed(0),
        pending_percentage: (((data.total_rounds - data.total_finalized_models) / total) * 100).toFixed(0),
      });
    } catch (err) {
      console.error("Failed to fetch client dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", icon: <FaChartLine />, path: "/dashboardClient" },
    { name: "Send Updates", icon: <FaDatabase />, path: "/sendUpdates" },
    { name: "Iterations", icon: <FaSyncAlt />, path: "/clientIterations" },
  ];

  if (!user) return null;

  // Chart data
  const pieData1 = [
    { name: "Completed Models", value: stats.total_finalized_models },
    { name: "Ongoing Rounds", value: stats.current_running_rounds },
  ];



  const COLORS1 = ["#00C49F", "#FF8042"];

  return (
    <div className="dashboard-container1">
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

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <p className="hospital-name">🏥 {user.hospital}</p>
            <h2>Client Dashboard</h2>
            <span className="role">Role: {user.role}</span>
          </div>
        </div>

        <div className="cards-container">
          <div className="card">
            <h3>Current Running Iterations</h3>
            <p className="card-value blue">
              {loading ? "…" : stats.current_running_rounds}
            </p>
          </div>
          <div className="card">
            <h3>Total Rounds</h3>
            <p className="card-value green">
              {loading ? "…" : stats.total_rounds}
            </p>
          </div>
          <div className="card">
            <h3>Total Finalized Models</h3>
            <p className="card-value orange">
              {loading ? "…" : stats.total_finalized_models}
            </p>
          </div>
        </div>
        <div className="analytics-section">
          <h3>Participation Analysis</h3>
          <p>Below metrics summarize your activity in the federated network:</p>
          <ul className="analysis-list">
            <li>✔️ You are currently involved in {stats.current_running_rounds} ongoing iteration(s).</li>
            <li>📊 You have participated in {stats.total_rounds} total training round(s).</li>
            <li>🏁 You contributed to {stats.total_finalized_models} finalized model(s).</li>
          </ul>
          <p>Future updates will include performance graphs and model contribution visualizations.</p>
        </div>


        <div className="analytics-section">
          <h3>Participation Analysis</h3>
          <div className="charts-wrapper">
            {/* Chart 1 */}
            <div className="chart-item">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData1}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {pieData1.map((entry, index) => (
                      <Cell key={`cell1-${index}`} fill={COLORS1[index % COLORS1.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
              <p>Completed Models vs Ongoing Rounds</p>
            </div>


          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardClient;
