import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";

const FetchClients = ({ centralAuthId, email }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [dataDomain, setDataDomain] = useState("");
  const [modelName, setModelName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchAssignments();
  });

  const fetchAssignments = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/fetch_assign/${email}/`);
      const data = res.data;
      console.log("Assignments response:", data); // 👈 check actual structure
      setAssignments(Array.isArray(data) ? data : data.assignments || []);
    } catch (err) {
      console.error(err);
    }
  };
  

  const handleSearch = async (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length >= 2) {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/filter_client?search=${e.target.value}`);
        setClients(res.data);
      } catch (err) {
        console.error(err);
      }
    } else {
      setClients([]);
    }
  };

  const handleAddClick = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleSubmitAssignment = async () => {
    if (!dataDomain || !modelName) return alert("Fill both fields!");
    console.log({
      central_auth_id: centralAuthId,
      client_id: selectedClient.id,
      data_domain: dataDomain,
      model_name: modelName,
    });
    try {
      const res = await axios.post("http://127.0.0.1:8000/assign_client/", {
        central_auth_id: centralAuthId,
        client_id: selectedClient.id,
        data_domain: dataDomain,
        model_name: modelName,
      });
      toast.success(res.data.message || "Assigned successful!");
      
      fetchAssignments();
      setShowModal(false);
      setDataDomain("");
      setModelName("");
      setSelectedClient(null);
      setClients(clients.filter((c) => c.id !== selectedClient.id));
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Something went wrong!";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="assign-clients-container">
      <h3>Assign Clients</h3>
      <input
        type="text"
        placeholder="Search client by email or hospital..."
        value={searchQuery}
        onChange={handleSearch}
        className="search-input"
      />

      <ul className="search-results">
        {clients.map((client) => (
          <li key={client.id} className="client-item">
            <span>{client.email} ({client.hospital})</span>
            <button onClick={() => handleAddClick(client)}>Add</button>
          </li>
        ))}
      </ul>

      <h4>Assigned Clients</h4>
      <ul className="assigned-list">
        {assignments.map((a) => (
          <li key={a.id} className="assigned-item">
            <div className="assigned-left">
              <span className="assigned-email">{a.client_email}</span>
              <span className="assigned-hospital">({a.client_hospital})</span>
            </div>
            <div className="assigned-details">
              <span className="assigned-model">Model: {a.model_name}</span>
              <span className="assigned-domain">Domain: {a.data_domain}</span>
              <span className="assigned-date">
                {new Date(a.assigned_at).toLocaleString()}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Assign {selectedClient.email}</h4>
            <label>
              Data Domain:
              <input
                type="text"
                value={dataDomain}
                onChange={(e) => setDataDomain(e.target.value)}
              />
            </label>
            <label>
              Model Name:
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />
            </label>
            <div className="modal-buttons">
              <button onClick={handleSubmitAssignment}>Assign</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FetchClients;
