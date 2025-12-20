import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PrincipalDashboard.module.css";
import {
  FaFileAlt,
  FaIdCard,
  FaCertificate,
  FaEye,
} from "react-icons/fa";

import API_BASE_URL from "../../utils/api";

/* ---------------- DEMO DATA (UNCHANGED) ---------------- */
const demoData = {
  LC: [],
  BONAFIDE: [
    {
      name: "Vikas More",
      standard: "8th",
      date: "11-Dec-2025",
      status: "Pending",
    },
  ],
  IDCARD: [
    {
      name: "Sneha Jadhav",
      standard: "7th",
      date: "09-Dec-2025",
      status: "Approved",
    },
  ],
};

const PrincipalDashboard = () => {
  const [activeDoc, setActiveDoc] = useState("LC");

  // 🔹 REAL pending LC data
  const [pendingLCs, setPendingLCs] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Reject modal state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLcId, setRejectLcId] = useState(null);

  const navigate = useNavigate();

  /* -------- Logout -------- */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  /* -------- Preview -------- */
  const handlePreview = (docType, studentName) => {
    alert(`Previewing ${docType} document for ${studentName}`);
  };

  /* -------- Principal Approves LC -------- */
  const handleApproveLC = async (lcId) => {
    try {
      const approvedBy = "PRINCIPAL";

      const res = await fetch(`${API_BASE_URL}/api/lc/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lcId, approvedBy }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to approve LC");
        return;
      }

      alert("LC approved successfully ✅");
      setPendingLCs((prev) => prev.filter((lc) => lc.lcId !== lcId));
    } catch (err) {
      console.error("Approve LC error:", err);
      alert("Server error while approving LC");
    }
  };

  /* -------- Open Reject Modal -------- */
  const openRejectModal = (lcId) => {
    setRejectLcId(lcId);
    setRejectReason("");
    setRejectOpen(true);
  };

  /* -------- Confirm Reject LC -------- */
  const confirmRejectLC = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter rejection reason");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/lc/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lcId: rejectLcId,
          approvedBy: "PRINCIPAL",
          rejectionReason: rejectReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to reject LC");
        return;
      }

      alert("LC rejected successfully ❌");
      setPendingLCs((prev) => prev.filter((lc) => lc.lcId !== rejectLcId));
      setRejectOpen(false);
    } catch (err) {
      console.error("Reject LC error:", err);
      alert("Server error while rejecting LC");
    }
  };

  /* -------- Fetch Pending LC Requests -------- */
  useEffect(() => {
    if (activeDoc !== "LC") return;

    const fetchPendingLCs = async () => {
      try {
        const schoolName = localStorage.getItem("schoolName");
        if (!schoolName) return;

        setLoading(true);
        const res = await fetch(
  `${API_BASE_URL}/api/lc/pending?schoolName=${encodeURIComponent(
    schoolName
  )}`
);

        const data = await res.json();
        if (res.ok) setPendingLCs(data.pendingLCs || []);
        else setPendingLCs([]);
      } catch (err) {
        console.error("Error fetching pending LC:", err);
        setPendingLCs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingLCs();
  }, [activeDoc]);

  return (
    <div className={styles.container}>
      {/* ================= HEADER ================= */}
      <div className={styles.headerRow}>
        <div className={styles.header}>
          <h2>Principal Dashboard</h2>
          <p>Review and approve document requests</p>
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* ================= DOCUMENT TABS ================= */}
      <div className={styles.docGrid}>
        <div
          className={`${styles.docBox} ${activeDoc === "LC" ? styles.active : ""}`}
          onClick={() => setActiveDoc("LC")}
        >
          <FaCertificate />
          <span>Leaving Certificate</span>
        </div>

        <div
          className={`${styles.docBox} ${activeDoc === "BONAFIDE" ? styles.active : ""}`}
          onClick={() => setActiveDoc("BONAFIDE")}
        >
          <FaFileAlt />
          <span>Bonafide</span>
        </div>

        <div
          className={`${styles.docBox} ${activeDoc === "IDCARD" ? styles.active : ""}`}
          onClick={() => setActiveDoc("IDCARD")}
        >
          <FaIdCard />
          <span>ID Card</span>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className={styles.tableSection}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Standard</th>
              <th>Request Date</th>
              <th>Status</th>
              <th>Preview</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {activeDoc === "LC" &&
              (loading ? (
                <tr><td colSpan="6" align="center">Loading...</td></tr>
              ) : pendingLCs.length === 0 ? (
                <tr><td colSpan="6" align="center">No pending LC requests</td></tr>
              ) : (
                pendingLCs.map((item) => (
                  <tr key={item.lcId}>
                    <td>{item.name}</td>
                    <td>{item.standard}</td>
                    <td>{new Date(item.requestedAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`${styles.status} ${styles.pending}`}>
                        PENDING
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.previewBtn}
                        onClick={() => handlePreview("LC", item.name)}
                      >
                        <FaEye /> View
                      </button>
                    </td>
                    <td>
                      <button
                        className={styles.approveBtn}
                        onClick={() => handleApproveLC(item.lcId)}
                      >
                        Approve
                      </button>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => openRejectModal(item.lcId)}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              ))}
          </tbody>
        </table>
      </div>

      {/* ================= REJECT MODAL ================= */}
      {rejectOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Reject Leaving Certificate</h3>
            <textarea
              placeholder="Enter rejection reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button onClick={() => setRejectOpen(false)}>Cancel</button>
              <button className={styles.rejectBtn} onClick={confirmRejectLC}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrincipalDashboard;
