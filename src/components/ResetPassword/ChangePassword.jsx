// ChangePassword.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../SchoolLogin/SchoolLogin.module.css"; // reuse your styles
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ChangePassword = () => {
  const query = useQuery();
  const navigate = useNavigate();

  // account may be schoolName, username or email; we prefill schoolName field with this
  const account = query.get("account") || "";
  const tempLogin = query.get("tempLogin") === "true";

  const [form, setForm] = useState({
    schoolName: account || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // autofocus or small hint logic could go here
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.schoolName) return "Please enter your School Name (or account identifier).";
    if (!form.currentPassword) return "Please enter your current password.";
    if (!form.newPassword || !form.confirmPassword) return "Please enter and confirm your new password.";
    if (form.newPassword !== form.confirmPassword) return "New passwords do not match.";
    if (form.newPassword.length < 6) return "New password must be at least 6 characters.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: form.schoolName,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Password changed successfully. Please login with your new password.");
        navigate("/"); // go to login
      } else {
        alert(data.message || "Failed to change password. Please check your details.");
      }
    } catch (err) {
      console.error("Change password error:", err);
      alert("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div style={{ maxWidth: 480, margin: "60px auto", padding: 20 }}>
        <h2>Change Password</h2>

        {tempLogin && (
          <div style={{ background: "#fff9e6", border: "1px solid #ffd07a", padding: 12, borderRadius: 6, marginBottom: 12 }}>
            <strong>Note:</strong> You signed in with a temporary password. Enter it as the <em>Current password</em> below, then choose a new permanent password.
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label style={{ fontSize: 14, marginBottom: 6 }}>School Name / Account (editable)</label>
          <input
            name="schoolName"
            placeholder="School Name (as registered)"
            value={form.schoolName}
            onChange={handleChange}
            required
          />

          <label style={{ fontSize: 14, marginBottom: 6 }}>Current password</label>
          <input
            name="currentPassword"
            type="password"
            placeholder={tempLogin ? "Temporary password (from email)" : "Current password"}
            value={form.currentPassword}
            onChange={handleChange}
            required
          />

          <label style={{ fontSize: 14, marginBottom: 6 }}>New password</label>
          <input
            name="newPassword"
            type="password"
            placeholder="New password (min 6 chars)"
            value={form.newPassword}
            onChange={handleChange}
            required
          />

          <label style={{ fontSize: 14, marginBottom: 6 }}>Confirm new password</label>
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? "Saving..." : "Change Password"}
            </button>
            <button type="button" className={styles.logoutBtn} onClick={() => navigate("/")}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
