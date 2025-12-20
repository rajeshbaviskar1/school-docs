import React, { useState, useEffect } from "react";
import { FaFileAlt, FaIdCard, FaCertificate } from "react-icons/fa";
import styles from "./DocumentStatus.module.css";

const DocumentStatus = () => {
  const [activeDoc, setActiveDoc] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // ✅ REAL LC DATA
  const [lcRecords, setLcRecords] = useState([]);

  /* ================= FETCH ALL LC ================= */
  useEffect(() => {
    if (activeDoc !== "LC") return;

    const fetchAllLC = async () => {
      try {
        const schoolName = localStorage.getItem("schoolName");
        if (!schoolName) return;

        setLoading(true);

        const res = await fetch(
          `http://localhost:5000/api/lc/all?schoolName=${encodeURIComponent(
            schoolName
          )}`
        );

        const data = await res.json();

        if (res.ok && Array.isArray(data.records)) {
          setLcRecords(
            data.records.map((r) => ({
              lcId: r.lcId, // ⭐ IMPORTANT
              name: r.name || "-",
              standard: r.standard || "-",
              status:
                r.status === "PENDING"
                  ? "Pending"
                  : r.status === "APPROVED"
                  ? "Approved"
                  : "Rejected",
            }))
          );
        } else {
          setLcRecords([]);
        }
      } catch (err) {
        console.error("Fetch LC error:", err);
        setLcRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllLC();
  }, [activeDoc]);

  const records = {
    LC: lcRecords,
    BONAFIDE: [{ name: "Vikas More", standard: "8th", status: "Pending" }],
    IDCARD: [{ name: "Sneha Jadhav", standard: "7th", status: "Approved" }],
  };

  /* ================= FILTER ================= */
  const filteredData =
    records[activeDoc]?.filter((r) => {
      const matchSearch = r.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchFilter = filter === "ALL" || r.status === filter;
      return matchSearch && matchFilter;
    }) || [];

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  /* ================= ENTRY PAGE ================= */
  if (!activeDoc) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Document Status</h2>

        <div className={styles.buttonGrid}>
          <div className={styles.docButton} onClick={() => setActiveDoc("LC")}>
            <FaCertificate className={styles.docIcon} />
            <span>Leaving Certificate</span>
          </div>

          <div
            className={styles.docButton}
            onClick={() => setActiveDoc("BONAFIDE")}
          >
            <FaFileAlt className={styles.docIcon} />
            <span>Bonafide Certificate</span>
          </div>

          <div
            className={styles.docButton}
            onClick={() => setActiveDoc("IDCARD")}
          >
            <FaIdCard className={styles.docIcon} />
            <span>ID Card</span>
          </div>
        </div>
      </div>
    );
  }

  /* ================= DETAILS PAGE ================= */
  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>
          {activeDoc === "LC"
            ? "Leaving Certificate"
            : activeDoc === "BONAFIDE"
            ? "Bonafide Certificate"
            : "ID Card"}
        </h2>

        <button
          className={styles.backBtn}
          onClick={() => {
            setActiveDoc(null);
            setSearch("");
            setFilter("ALL");
            setCurrentPage(1);
          }}
        >
          ← Back
        </button>
      </div>

      {/* ================= LEGEND ================= */}
      <div className={styles.legend}>
        <span className={styles.pending}>Pending</span>
        <span className={styles.approved}>Approved</span>
        <span className={styles.rejected}>Rejected</span>
      </div>

      {/* ================= CONTROLS ================= */}
      <div className={styles.controls}>
        <input
          placeholder="Search student..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />

        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* ================= TABLE ================= */}
      {loading ? (
        <div className={styles.skeletonWrapper}>
          <div className={styles.skeletonRow} />
          <div className={styles.skeletonRow} />
        </div>
      ) : (
        <div className={styles.tableBox}>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Standard</th>
                <th>Status</th>
                <th>Download</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.name}</td>
                  <td>{row.standard}</td>
                  <td>
                    <span
                      className={`${styles.status} ${
                        row.status === "Pending"
                          ? styles.pending
                          : row.status === "Approved"
                          ? styles.approved
                          : styles.rejected
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className={styles.downloadBtn}
                      disabled={row.status !== "Approved"} // 🔒 IMPORTANT
                      onClick={() =>
                        window.open(
                          `http://localhost:5000/api/lc/download/${row.lcId}`,
                          "_blank"
                        )
                      }
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan="4" align="center">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};



export default DocumentStatus;
