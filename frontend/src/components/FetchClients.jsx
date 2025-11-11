import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FetchClients = ({ centralAuthId, email }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [iterations, setIterations] = useState([]);
  const [selectedIteration, setSelectedIteration] = useState("");

  // Model & domain auto-filled from selected iteration
  const [modelName, setModelName] = useState("");
  const [dataDomain, setDataDomain] = useState("");

  useEffect(() => {
    fetchAssignments();
    fetchIterations();
  }, []);

  // Fetch already assigned clients
  const fetchAssignments = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/fetch_assign/${email}/`);
      const data = res.data;
      setAssignments(Array.isArray(data) ? data : data.assignments || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch current iterations (version > 0)
  const fetchIterations = async () => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/central-models/?user_id=${centralAuthId}`
      );
      const data = res.data.filter((i) => Number(i.version) > 0);
      setIterations(data);
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

  const handleIterationChange = (iterationId) => {
    setSelectedIteration(iterationId);
    const iteration = iterations.find((i) => i.id === Number(iterationId));
    if (iteration) {
      setModelName(iteration.model_name);
      setDataDomain(iteration.dataset_domain);
    } else {
      setModelName("");
      setDataDomain("");
    }
  };
  

  const handleSubmitAssignment = async () => {
    if (!selectedIteration) return toast.warning("Select an iteration first!");
    try {
      const res = await axios.post("http://127.0.0.1:8000/assign_client/", {
        central_auth_id: centralAuthId,
        client_id: selectedClient.id,
        iteration_name: iterations.find((i) => i.id === Number(selectedIteration)).iteration_name,
        data_domain: dataDomain,
        model_name: modelName,
      });
      toast.success(res.data.message || "Assigned successfully!");
      fetchAssignments();
      setShowModal(false);
      setSelectedClient(null);
      setSelectedIteration("");
      setModelName("");
      setDataDomain("");
      setClients(clients.filter((c) => c.id !== selectedClient.id));
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Something went wrong!";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="assign-clients-container">
      <ToastContainer position="top-right" autoClose={3000} />
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
              <span className="assigned-domain">Iteration: {a.iteration_name}</span>
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
              Select Iteration:
              <select
                value={selectedIteration}
                onChange={(e) => handleIterationChange(e.target.value)}
              >
                <option value="">-- Select Iteration --</option>
                {iterations.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.iteration_name} (v{i.version})
                  </option>
                ))}
              </select>
            </label>
            <div className="modal-details">
              <p><strong>Model:</strong> {modelName}</p>
              <p><strong>Domain:</strong> {dataDomain}</p>
            </div>
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
