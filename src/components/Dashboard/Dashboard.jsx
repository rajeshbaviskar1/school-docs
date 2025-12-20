// Dashboard.jsx
import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";

import {
  FaHome, FaSchool, FaUserGraduate, FaFileAlt, FaIdCard, FaUsers, FaFileExport, FaSignOutAlt
} from "react-icons/fa";

import SchoolInfo from "./SchoolInfo/SchoolInfo"; // SchoolInfo component
import Home from "./HomePage/Home"; // Home component with charts

// new modal component import (adjust path if you place it elsewhere)
import TempChangePasswordModal from "./TempChangePasswordModal";
// new RegisterStudent component (moved)
import RegisterStudent from "./RegisterStudent";
// Note: LeavingCertificates import removed (moved into MainOperation)
// import LeavingCertificates from "./LeavingCertificates";
// new TotalStudents component (moved)
import TotalStudents from "./TotalStudents";

// NEW: MainOperation component (contains leaving UI now)
import MainOperation from "./MainOperation";
import DocumentStatus from "./DocumentStatus";
import API_BASE_URL from "../../utils/api";



const Dashboard = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeSection, setActiveSection] = useState("home");
  const [students, setStudents] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [formData, setFormData] = useState({
    name: "", motherName: "", motherTongue: "", raceCaste: "",
    nationality: "Indian", birthPlace: "", dob: "", lastSchool: "",
    dateAdmission: "", standard: "", progress: "", conduct: "",
    dateLeaving: "", reasonLeaving: "", remark: ""
  });

  // password form for Change Password section
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const schoolName = localStorage.getItem("schoolName") || "Your School";

  // Temp change-password modal state
  const [showTempModal, setShowTempModal] = useState(false);




  useEffect(() => {
    fetchStudents();
    fetchSchoolInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch(
  `${API_BASE_URL}/api/get-students?schoolName=${encodeURIComponent(schoolName)}`
);
      const data = await res.json();
      if (data && data.students) { 
        setStudents(data.students || []);
        setTotalStudents(data.count || (data.students && data.students.length) || 0);
      } else if (Array.isArray(data)) {
        setStudents(data);
        setTotalStudents(data.length);
      } else {
        setStudents([]);
        setTotalStudents(0);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudents([]);
      setTotalStudents(0);
    }
  };

  const fetchSchoolInfo = async () => {
    try {
      console.log("[Dashboard] fetching school info for:", schoolName);
      const res = await fetch(
  `${API_BASE_URL}/api/school-info/${encodeURIComponent(schoolName)}`
);
      if (!res.ok) {
        console.warn("[Dashboard] school-info fetch failed", res.status);
        throw new Error("Failed to fetch school info");
      }
      const data = await res.json();
      console.log("[Dashboard] schoolInfo:", data);
      setSchoolInfo(data);

      // --- robust temp-login detection logic ---
      try {
        const raw = localStorage.getItem("tempLoginUser");
        console.log("[Dashboard] raw tempLoginUser:", raw);
        if (!raw) {
          console.log("[Dashboard] no tempLoginUser in localStorage");
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          console.warn("[Dashboard] tempLoginUser parse failed, clearing it", e);
          localStorage.removeItem("tempLoginUser");
          return;
        }

        const parsedUsername = parsed && parsed.username ? String(parsed.username) : null;
        const parsedTs = parsed && parsed.ts ? Number(parsed.ts) : null;

        const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
        if (parsedTs && Date.now() - parsedTs > maxAgeMs) {
          console.warn("[Dashboard] tempLoginUser is stale; removing");
          localStorage.removeItem("tempLoginUser");
          return;
        }

        const savedUsername = localStorage.getItem("savedUsername");
        const possibleMatches = [
          parsedUsername,
          savedUsername,
          localStorage.getItem("schoolName")
        ].filter(Boolean);

        const infoUsername = data && data.username ? String(data.username) : null;

        console.log("[Dashboard] comparing parsedUsername:", parsedUsername, "info.username:", infoUsername, "savedUsername:", savedUsername);

        const isMatch = possibleMatches.some(x => infoUsername && x && x === infoUsername);
        const fallbackMatch = (!infoUsername && parsedUsername && parsedUsername === localStorage.getItem("schoolName"));

        if (isMatch || fallbackMatch) {
          console.log("[Dashboard] tempLogin match -> showing modal");
          setShowTempModal(true);
        } else {
          console.log("[Dashboard] tempLogin exists but did not match current user; not showing modal");
        }

      } catch (ex) {
        console.error("[Dashboard] error while processing tempLoginUser", ex);
      }

    } catch (err) {
      console.error("Error fetching school info:", err);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/register-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, schoolName }),
      });
      const data = await res.json();
      if (res.ok || (data && data.success)) {
        alert(data.message || "Student registered");
        setFormData({
          name: "", motherName: "", motherTongue: "", raceCaste: "",
          nationality: "Indian", birthPlace: "", dob: "", lastSchool: "",
          dateAdmission: "", standard: "", progress: "", conduct: "",
          dateLeaving: "", reasonLeaving: "", remark: ""
        });
        await fetchStudents();
        setActiveSection("update");
      } else {
        alert(data.message || "Error registering student");
      }
    } catch (err) {
      console.error("Register error:", err);
      alert("Server error while registering student");
    }
  };

  const renderStudentTable = () => {
    if (!students.length) return <p>No student records.</p>;
    return (
      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              {Object.keys(students[0]).map((key) => <th key={key}>{key.toUpperCase()}</th>)}
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => (
              <tr key={idx}>
                {Object.keys(s).map((k) => <td key={k}>{s[k] || ""}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Sidebar buttons - Logout will be added as last item
  const sidebarButtons = [
    { id: "home", label: "Home", icon: <FaHome /> },
    { id: "schoolInfo", label: "School Info", icon: <FaSchool /> },
    { id: "register", label: "Register Student", icon: <FaUserGraduate /> },
    { id: "total", label: "Total Students", icon: <FaUsers /> },

    // NEW: Main Operation entry right after Total Students
    { id: "mainoperation", label: "Main Operation", icon: <FaFileAlt /> },
    { id: "documentStatus", label: "Document Status", icon: <FaFileAlt /> },

    { id: "update", label: "Update Student", icon: <FaUserGraduate /> },
    { id: "export", label: "Export to CSV", icon: <FaFileExport /> },
    { id: "logout", label: "Logout", icon: <FaSignOutAlt /> },
  ];

  // Utility: convert array of objects to CSV and trigger download
  const exportToCSV = (rows) => {
    if (!rows || !rows.length) {
      alert("No student data to export.");
      return;
    }

    const headerKeys = Object.keys(rows[0]);
    const csvRows = [];
    csvRows.push(headerKeys.map(h => `"${h}"`).join(","));
    for (const row of rows) {
      const values = headerKeys.map(k => {
        let val = row[k] === null || row[k] === undefined ? "" : String(row[k]);
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(values.join(","));
    }
    const csvContent = csvRows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const ts = now.toISOString().slice(0,19).replace(/[:T]/g,'-');
    const filename = `${schoolName.replace(/\s+/g,'_')}_students_${ts}.csv`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Change password handlers
  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert("Please fill all password fields.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/change-password`,{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to change password.");
        return;
      }

      const wantLogout = window.confirm(
        "Password changed successfully.\n\nPress OK to logout now, or Cancel to go to Home page."
      );

      if (wantLogout) {
        logout();
        return;
      }

      setActiveSection("home");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });

    } catch (err) {
      console.error("Change password error:", err);
      alert("Server error while changing password.");
    }
  };

  // Handler when temp modal closes
  const onTempModalClose = ({ success }) => {
    setShowTempModal(false);
    if (success) {
      fetchSchoolInfo();
    }
  };

  const documentStatus = {
  lc: { pending: 3, approved: 5, rejected: 1 },
  bonafide: { pending: 2, approved: 4, rejected: 0 },
  idcard: { pending: 1, approved: 6, rejected: 0 },
};


  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <header className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/mnt/data/ce35d142-6d6f-4ea5-9f8c-1e2ba6ec849b.png"
            alt="logo"
            style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 6 }}
          />
          <div className={styles.headerLeft}>MahaDigital</div>
        </div>

        <div className={styles.headerCenter}>
          Welcome, <b>{schoolName}</b>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className={styles.profileBtn ?? styles.logoutBtn}
            onClick={() => setActiveSection("profile")}
            title="Profile"
            style={{ minWidth: 90 }}
          >
            Profile
          </button>
        </div>
      </header>

      <div className={styles.mainWrapper}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
  {sidebarButtons.map(btn => (
    <button
      key={btn.id}
      className={`${styles.sidebarBtn} ${activeSection === btn.id ? styles.active : ""}`}
      onClick={() => {
        if (btn.id === "logout") return logout();
        setActiveSection(btn.id);
      }}
    >
      <span className={styles.icon}>{btn.icon}</span> {btn.label}
    </button>
  ))}

</aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Home Section */}
          {activeSection === "home" && (
            <div>
              <div className={styles.summaryCards}>
                <div className={styles.card} onClick={() => setActiveSection("total")}>
                  <FaUserGraduate size={24} />
                  <p>Total Students</p>
                  <h2>{totalStudents}</h2>
                </div>

                {/* kept two summary cards on home */}
                <div className={styles.card} onClick={() => setActiveSection("bonafide")}>
                  <FaFileAlt size={24} />
                  <p>Bonafide Certificates Printed</p>
                  <h2>0</h2>
                </div>
                <div className={styles.card} onClick={() => setActiveSection("idcard")}>
                  <FaIdCard size={24} />
                  <p>ID Cards Printed</p>
                  <h2>0</h2>
                </div>
              </div>

              {/* Charts Section */}
              <Home />
            </div>
          )}

          {/* Profile Section */}
          {activeSection === "profile" && (
            <div className={styles.box}>
              <div className={styles.boxHeader}>Profile</div>

              <p><strong>School:</strong> {schoolName}</p>

              {schoolInfo ? (
                <div style={{ marginTop: 8 }}>
                  <p><strong>Principal:</strong> {schoolInfo.principalName || "-"}</p>
                  <p><strong>Email:</strong> {schoolInfo.schoolEmail || "-"}</p>
                  <p className={styles.addressLine}>
                    {schoolInfo.village || ""} • {schoolInfo.district || ""}
                  </p>

                  <div style={{ marginTop: 15, display: "flex", gap: 12 }}>
                    <button
                      className={styles.profileActionBtn}
                      onClick={() => setActiveSection("changePassword")}
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 8 }}>
                  <p>No school info available.</p>
                </div>
              )}
            </div>
          )}

          {/* Change Password Section */}
          {activeSection === "changePassword" && (
            <div className={styles.box}>
              <div className={styles.boxHeader}>Change Password</div>

              <form onSubmit={handleChangePassword} className={styles.form}>
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="Current password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordFormChange}
                  required
                />
                <input
                  type="password"
                  name="newPassword"
                  placeholder="New password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordFormChange}
                  required
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordFormChange}
                  required
                />

                <div style={{ display: "flex", gap: 12 }}>
                  <button type="submit" className={styles.submitBtn}>Change Password</button>
                  <button type="button" className={styles.logoutBtn} onClick={() => setActiveSection("home")}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* School Info Section */}
          {activeSection === "schoolInfo" && (
            <SchoolInfo schoolInfo={schoolInfo} refresh={() => fetchSchoolInfo()} />
          )}

          {/* Register Student Section - MOVED to RegisterStudent.jsx */}
          {activeSection === "register" && (
            <RegisterStudent
              formData={formData}
              handleChange={handleChange}
              handleRegister={handleRegister}
            />
          )}

          {/* Total Students Section (moved to its own file) */}
          {activeSection === "total" && (
            <TotalStudents
              totalStudents={totalStudents}
              students={students}
              renderStudentTable={renderStudentTable}
            />
          )}

          {/* NEW: Main Operation Section (MainOperation contains the Leaving UI now) */}
          {activeSection === "mainoperation" && (
            <MainOperation /* setActiveSection still passed for other nav needs */ setActiveSection={setActiveSection} />
          )}
          {activeSection === "documentStatus" && (
             <DocumentStatus />
          )}

          {/* Update Section */}
          {activeSection === "update" && (
            <div className={styles.box}>
              <div className={styles.boxHeader}>Update Student Details</div>
              {renderStudentTable()}
            </div>
          )}

          {/* Export to CSV Section (NEW, at end) */}
          {activeSection === "export" && (
            <div className={styles.box}>
              <div className={styles.boxHeader}>Export Students to CSV</div>
              <p>Download a CSV export of all current students for <b>{schoolName}</b>.</p>
              <div style={{ margin: "12px 0" }}>
                <button
                  className={styles.submitBtn}
                  onClick={() => exportToCSV(students)}
                >
                  Export Current Students (CSV)
                </button>
              </div>

              <div style={{ marginTop: 16 }}>
                <strong>Preview (first 10 rows):</strong>
                <div style={{ marginTop: 8 }}>
                  {students && students.length ? (
                    <div className={styles.tableContainer}>
                      <table>
                        <thead>
                          <tr>
                            {Object.keys(students[0]).map((key) => <th key={key}>{key.toUpperCase()}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {students.slice(0, 10).map((s, idx) => (
                            <tr key={idx}>
                              {Object.keys(s).map((k) => <td key={k}>{s[k] || ""}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p>No students to preview.</p>}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Temp change-password modal (one-time) */}
      <TempChangePasswordModal
        open={showTempModal}
        onClose={onTempModalClose}
        username={schoolInfo && schoolInfo.username ? schoolInfo.username : undefined}
        schoolName={schoolName}
      />
    </div>
  );

  
};


export default Dashboard;

