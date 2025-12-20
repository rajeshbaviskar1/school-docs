// MainOperation.jsx
import React, { useState } from "react";
import styles from "./MainOperation.module.css";
import { FaFileSignature, FaFileAlt, FaIdCard } from "react-icons/fa";
import API_BASE_URL from "../../utils/api";

/* sampleData used when no backend result is present (for testing) */
const sampleData = {
  schoolName: "Vikas Vidyalaya",
  phone: "8999898989",
  email: "rajesh@gmail.com",
  schoolRegNo: "7888",
  studentIdSimple: "1256566656566898989",
  studentAadhar: "898965989898",
  name: "Rajesh Baviskar",
  motherName: "Pratibha",
  nationality: "Indian",
  motherTongue: "Marathi",
  caste: "Maratha",
  dobText: "03-05-1996",
  admissionDate: "27/06/2024",
  leavingDate: "27-02-2025",
  standard: "5",
  progress: "Good",
  conduct: "Good",
  placeOfBirth: "malkheda, Amalner, Jalgaon, Maharashtra",
  remarks: "No pending dues",
  principalName: "Headmaster"
};

const MainOperation = ({ setActiveSection }) => {
  const [view, setView] = useState("cards"); // 'cards' | 'leaving' | 'pending'
  const [pendingTitle, setPendingTitle] = useState("");

  // Leaving search state
  const [searchName, setSearchName] = useState("");
  const [searchStandard, setSearchStandard] = useState("");
  const [searchAadhar, setSearchAadhar] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
     

  // 🔹 Clerk sends LC request (creates PENDING record)
const handleRequestLC = async (student) => {
  try {
    const schoolName = localStorage.getItem("schoolName");
    if (!schoolName) {
      alert("School not found. Please login again.");
      return;
    }

    const payload = {
      studentId: student.id,
      schoolName: schoolName,
      requestedBy: "CLERK"
    };

    const res = await fetch(`${API_BASE_URL}/api/lc/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to request LC");
      return;
    }

    alert("LC request sent to Principal for approval ✅");
  } catch (err) {
    console.error("LC request error:", err);
    alert("Server error while requesting LC");
  }
};


  const openLeaving = () => {
    setView("leaving");
    setSearchName("");
    setSearchStandard("");
    setSearchAadhar("");
    setResult(null);
    setMatches([]);
    setError("");
    setSearched(false);
  };

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
      if (searchAadhar) params.append("aadhar", searchAadhar.trim());
      params.append("schoolName", schoolName);

      const url = `${API_BASE_URL}/api/search-leaving-student?${params.toString()}`;

      const res = await fetch(url, { method: "GET" });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response from search endpoint:", text.slice(0, 1000));
        setError("Unexpected server response (non-JSON). Received HTML/text instead of JSON.");
        setSearched(true);
        setLoading(false);
        return;
      }

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

  const handlePending = (title) => {
    setPendingTitle(title);
    setView("pending");
  };

  // Open preview modal: uses result if available, else sampleData
  const openPreview = (student) => {
    const data = student ? {
      ...sampleData,
      ...student,
      name: student.name || sampleData.name,
      motherName: student.motherName || sampleData.motherName,
      standard: student.standard || sampleData.standard,
      dobText: student.dob || sampleData.dobText,
      admissionDate: student.dateAdmission || sampleData.admissionDate,
      leavingDate: student.dateLeaving || sampleData.leavingDate,
      placeOfBirth: student.birthPlace || sampleData.placeOfBirth,
      remarks: student.remark || sampleData.remarks
    } : sampleData;

    setPreviewData(data);
    setPreviewOpen(true);
  };

  // renderCertificateHtml adapted for PDF (A4 sizing)
  const renderCertificateHtmlForPdf = (d) => {
    const safe = (v) => (v ? v : "");
    return `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #111;">
        <div style="width:190mm; min-height:277mm; padding:10mm 10mm; box-sizing:border-box; background:#fff; position:relative;">
          <!-- Watermark for PDF (light, behind content) -->
          <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%) rotate(-22deg); font-size:36px; color:#21364a; opacity:0.06; font-weight:800; letter-spacing:1px; white-space:nowrap; z-index:0;">
            Preview — Leaving Certificate. Not for official use without Principal's permission
          </div>

          <div style="position:relative; z-index:1;">
            <div style="text-align:center; margin-bottom:6mm;">
              <div style="font-size:22px; font-weight:800; color:#12263b;">${safe(d.schoolName)}</div>
              <div style="font-size:18px; font-weight:700; margin-top:4px;">Leaving Certificate</div>
              <div style="font-size:12px; color:#555; margin-top:6px;">Phone: ${safe(d.phone)} • Email: ${safe(d.email)}</div>
            </div>

            <hr style="border:none; border-top:1px solid #e6eef8; margin:6mm 0 8mm 0;" />

            <div style="font-size:12.8px; line-height:1.55; color:#222;">
              <div style="margin-bottom:6px;"><strong>Student Name:</strong> ${safe(d.name)}</div>
              <div style="margin-bottom:6px;"><strong>Mother's Name:</strong> ${safe(d.motherName)}</div>
              <div style="margin-bottom:6px;"><strong>Standard:</strong> ${safe(d.standard)}</div>
              <div style="margin-bottom:6px;"><strong>Date of Birth:</strong> ${safe(d.dobText)}</div>
              <div style="margin-bottom:6px;"><strong>Admission Date:</strong> ${safe(d.admissionDate)}</div>
              <div style="margin-bottom:6px;"><strong>Leaving Date:</strong> ${safe(d.leavingDate)}</div>
              <div style="margin-bottom:6px;"><strong>Place of Birth:</strong> ${safe(d.placeOfBirth)}</div>
              <div style="margin-bottom:6px;"><strong>Nationality:</strong> ${safe(d.nationality)}</div>
              <div style="margin-bottom:6px;"><strong>Progress:</strong> ${safe(d.progress)}</div>
              <div style="margin-bottom:6px;"><strong>Conduct:</strong> ${safe(d.conduct)}</div>
              <div style="margin-bottom:6px;"><strong>Remarks:</strong> ${safe(d.remarks)}</div>
            </div>

            <hr style="border:none; border-top:1px solid #e6eef8; margin:10mm 0 10mm 0;" />

            <div style="display:flex; justify-content:space-between; margin-top:14mm; font-weight:700; color:#233;">
              <div style="width:45%; text-align:left;">
                <div>Principal / Headmaster</div>
                <div style="margin-top:12mm;">(Signature)</div>
              </div>
              <div style="width:45%; text-align:right;">
                <div>Date: ${safe(d.leavingDate)}</div>
              </div>
            </div>
          </div>
        </div>

        <style>
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </div>
    `;
  };

  // Download PDF function (dynamic import of html2pdf.js)
  const downloadPdf = async (d) => {
    if (!d) {
      alert("No certificate data available.");
      return;
    }

    try {
      // Create temporary container for the certificate HTML
      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.left = "-9999px";
      wrapper.style.top = "-9999px";
      wrapper.style.visibility = "hidden";
      wrapper.innerHTML = renderCertificateHtmlForPdf(d);
      document.body.appendChild(wrapper);

      // dynamic import so bundlers don't break if lib not present
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || html2pdfModule;

      // options tuned for A4, high-quality output
      const now = new Date();
      const stamp = now.toISOString().slice(0,19).replace(/[:T]/g,'-');
      const studentSafe = (d.name || "student").replace(/\s+/g,'_').replace(/[^\w-]/g,'');
      const schoolSafe = (d.schoolName || "school").replace(/\s+/g,'_').replace(/[^\w-]/g,'');
      const filename = `${schoolSafe}_LC_${studentSafe}_${stamp}.pdf`;

      const opt = {
        margin:       [8, 10, 8, 10],
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Generate and save the PDF
      await html2pdf().set(opt).from(wrapper).save();

      // cleanup
      wrapper.remove();
      setPreviewOpen(false);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Check console for details and ensure html2pdf.js is installed.");
    }
  };

  return (
    <div className={styles.box}>
      <div className={styles.boxHeader}>
        {view === "cards" ? "Main Operation" : view === "leaving" ? "Generate Leaving Certificate" : pendingTitle}
      </div>

      {view === "cards" && (
        <div className={styles.operationsGrid}>
          <div
            role="button"
            tabIndex={0}
            className={styles.operationCard}
            onClick={openLeaving}
            onKeyDown={(e) => { if (e.key === "Enter") openLeaving(); }}
          >
            <FaFileSignature size={40} className={styles.icon} />
            <h3>Issue Leaving Certificate</h3>
            <p>Search student & generate LC.</p>
          </div>

          <div
            role="button"
            tabIndex={0}
            className={styles.operationCard}
            onClick={() => handlePending("Issue Bonafide Certificate")}
            onKeyDown={(e) => { if (e.key === "Enter") handlePending("Issue Bonafide Certificate"); }}
          >
            <FaFileAlt size={40} className={styles.icon} />
            <h3>Issue Bonafide Certificate</h3>
            <p>Create a bonafide certificate for enrolled students.</p>
          </div>

          <div
            role="button"
            tabIndex={0}
            className={styles.operationCard}
            onClick={() => handlePending("Issue ID Card")}
            onKeyDown={(e) => { if (e.key === "Enter") handlePending("Issue ID Card"); }}
          >
            <FaIdCard size={40} className={styles.icon} />
            <h3>Issue ID Card</h3>
            <p>Generate and print a student identity card.</p>
          </div>
        </div>
      )}

      {/* Leaving search UI */}
      {view === "leaving" && (
        <div>
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

              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setView("cards")}
                style={{ marginLeft: 12 }}
              >
                Back
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
                          className={styles.btnPrimary} onClick={() => handleRequestLC(result)} > Send LC for Approval </button>
                  <button className={styles.btnSecondary} onClick={() => openPreview(result)}>Preview</button>
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
      )}

      {/* Pending box for Bonafide / ID Card */}
      {view === "pending" && (
        <div className={styles.pendingBox}>
          <div className={styles.pendingHeader}>
            <strong>{pendingTitle}</strong>
          </div>
          <div className={styles.pendingBody}>
            <p>Implementation pending — this feature will be added soon.</p>
            <div style={{ marginTop: 12 }}>
              <button
                className={styles.okBtn}
                onClick={() => setView("cards")}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Preview Modal (big + watermark) */}
      {previewOpen && previewData && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalLarge}>
            <div className={styles.modalHeader}>
              <div style={{ fontWeight: 700 }}>Preview — Leaving Certificate</div>
              <button className={styles.modalClose} onClick={() => setPreviewOpen(false)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.watermark}>
                Preview — Leaving Certificate. Not for official use without Principal's permission
              </div>

              <div className={styles.certificateLarge}>
                <div className={styles.certHeader}>
                  <div className={styles.schoolName}>{previewData.schoolName}</div>
                  <div className={styles.certTitle}>Leaving Certificate</div>
                  <div className={styles.schoolMeta}>Phone: {previewData.phone} • Email: {previewData.email}</div>
                </div>

                <div className={styles.certBody}>
                  <div className={styles.certRow}><span className={styles.certLabel}>Student Name</span><span className={styles.certValue}>{previewData.name}</span></div>
                  <div className={styles.certRow}><span className={styles.certLabel}>Mother's Name</span><span className={styles.certValue}>{previewData.motherName}</span></div>
                  <div className={styles.certRow}><span className={styles.certLabel}>Standard</span><span className={styles.certValue}>{previewData.standard}</span></div>
                  <div className={styles.certRow}><span className={styles.certLabel}>DOB</span><span className={styles.certValue}>{previewData.dobText}</span></div>
                  <div className={styles.certRow}><span className={styles.certLabel}>Admission Date</span><span className={styles.certValue}>{previewData.admissionDate}</span></div>
                  <div className={styles.certRow}><span className={styles.certLabel}>Leaving Date</span><span className={styles.certValue}>{previewData.leavingDate}</span></div>
                  <div className={styles.certRow}><span className={styles.certLabel}>Place of Birth</span><span className={styles.certValue}>{previewData.placeOfBirth}</span></div>
                  <div className={styles.certRow}><span className={styles.certLabel}>Progress</span><span className={styles.certValue}>{previewData.progress}</span></div>
                  <div className={styles.certRow}><span className={styles.certLabel}>Conduct</span><span className={styles.certValue}>{previewData.conduct}</span></div>
                  <div className={styles.certRow}><span className={styles.certLabel}>Remarks</span><span className={styles.certValue}>{previewData.remarks}</span></div>
                </div>

                <div className={styles.certFooter}>
                  <div>Principal / Headmaster</div>
                  <div>Date: {previewData.leavingDate}</div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setPreviewOpen(false)}>Close</button>

              <button className={styles.btnPrimary} onClick={() => downloadPdf(previewData)}>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MainOperation;
