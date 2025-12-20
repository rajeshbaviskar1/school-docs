// LeavingCertificates.jsx
import React, { useState } from "react";
import styles from "./LeavingCertificates.module.css";
import API_BASE_URL from "../../utils/api";

/**
 * LeavingCertificates
 * - Search student by name/standard (aadhar field present but ignored server-side for now)
 * - Calls GET /api/search-leaving-student?name=...&standard=...&schoolName=...
 * -
 */
const LeavingCertificates = ({ totalIssued = 0 }) => {
  const [searchName, setSearchName] = useState("");
  const [searchStandard, setSearchStandard] = useState("");
  const [searchAadhar, setSearchAadhar] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // backend base (use env var if provided)

  const handleSearch = async () => {
    setError("");
    setResult(null);
    setMatches([]);
    setSearched(false);

    if (!searchName && !searchStandard && !searchAadhar) {
      setError("Please enter Name or Standard (or Aadhar) to search.");
      return;
    }

    setLoading(true);
    try {
      const schoolName = localStorage.getItem("schoolName");
      if (!schoolName) {
        setError("Missing schoolName in localStorage. Please login again.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (searchName) params.append("name", searchName.trim());
      if (searchStandard) params.append("standard", searchStandard.trim());
      if (searchAadhar) params.append("aadhar", searchAadhar.trim()); // ignored server-side for now
      params.append("schoolName", schoolName);

      // Use explicit backend URL to avoid being routed to React dev server HTML
      const url = `${API_BASE_URL}/api/search-leaving-student?${params.toString()}`;

      const res = await fetch(url, { method: "GET" });

      // check content-type first
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        // try to read text to provide helpful error message (often index.html)
        const text = await res.text();
        console.error("Non-JSON response from search endpoint:", text.slice(0, 1000));
        setError("Unexpected server response (non-JSON). Check backend URL or proxy. Received HTML/text instead of JSON.");
        setSearched(true);
        setLoading(false);
        return;
      }

      // parse JSON
      const data = await res.json();
      setSearched(true);

      if (!res.ok) {
        const msg = (data && data.message) ? data.message : `Search failed (status ${res.status})`;
        setError(msg);
        setLoading(false);
        return;
      }

      if (!data || data.success !== true) {
        const msg = (data && data.message) ? data.message : "No results found.";
        setError(msg);
        setLoading(false);
        return;
      }

      setResult(data.student || null);
      setMatches(Array.isArray(data.list) ? data.list : []);
    } catch (err) {
      console.error("Search error:", err);
      setError("Server error while searching student (see console for details).");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchName("");
    setSearchStandard("");
    setSearchAadhar("");
    setResult(null);
    setMatches([]);
    setError("");
    setSearched(false);
  };

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <div className={styles.title}>Generate Leaving Certificate</div>
        <div className={styles.total}>Total: <strong>{totalIssued}</strong></div>
      </div>

      <div className={styles.intro}>
        <p>To generate the leaving certificate, search the student details below.</p>
      </div>

      <div className={styles.searchBlock}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Student Name</label>
            <input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>

          <div className={styles.field}>
            <label>Standard</label>
            <input
              value={searchStandard}
              onChange={(e) => setSearchStandard(e.target.value)}
              placeholder="e.g., 7, 8"
            />
          </div>

          <div className={styles.field}>
            <label>Aadhar Number</label>
            <input
              value={searchAadhar}
              onChange={(e) => setSearchAadhar(e.target.value)}
              placeholder="12-digit Aadhar (optional)"
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <button className={styles.btnSecondary} onClick={handleClear} type="button">
            Clear
          </button>
          <button className={styles.btnPrimary} onClick={handleSearch} type="button" disabled={loading}>
            {loading ? "Searching..." : "Search Student"}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>Search Result</div>

        {loading ? (
          <div className={styles.placeholder}>Searching...</div>
        ) : result ? (
          <div className={styles.resultCard}>
            <div className={styles.resultRow}>
              <div><strong>Name:</strong> {result.name}</div>
              <div><strong>Standard:</strong> {result.standard || "-"}</div>
            </div>
            <div className={styles.resultRow}>
              <div><strong>DOB:</strong> {result.dob || "-"}</div>
              <div><strong>Admission Date:</strong> {result.dateAdmission || "-"}</div>
            </div>
            <div className={styles.resultRow}>
              <div><strong>Mother:</strong> {result.motherName || "-"}</div>
              <div><strong>Last School:</strong> {result.lastSchool || "-"}</div>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button
                className={styles.btnPrimary}
                onClick={() => alert("Generate LC (next step) for " + (result.name || "student"))}
              >
                Generate LC
              </button>
              <button className={styles.btnSecondary} onClick={() => alert("Preview student details")}>
                Preview
              </button>
            </div>
          </div>
        ) : (searched && matches && matches.length > 0) ? (
          <div className={styles.list}>
            <div className={styles.smallText}>Multiple matches found ({matches.length}). Click to view:</div>
            {matches.map((s, idx) => (
              <div key={s.id || idx} className={styles.listItem}>
                <div className={styles.itemLeft}>
                  <div className={styles.itemName}>{s.name}</div>
                  <div className={styles.itemMeta}>Standard: {s.standard || "-"}</div>
                </div>
                <div className={styles.itemRight}>
                  <button
                    className={styles.smallBtn}
                    onClick={() => { setResult(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.placeholder}>
            {!searched ? "No student selected. Use the search above to find the student." : "No results found."}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeavingCertificates;
