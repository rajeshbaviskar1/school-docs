// ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../SchoolLogin/SchoolLogin.module.css"; // reuse styles or create new
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const query = useQuery();
  const navigate = useNavigate();

  // token/email for token-based reset (kept for backward compatibility)
  const token = query.get("token") || "";
  const email = query.get("email") || "";

  // tempLogin flow: when user logged in with temporary password
  // account can be either email or username (we use it only to display / prefill)
  const tempLogin = query.get("tempLogin") === "true";
  const account = query.get("account") || ""; // username or email from login flow

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user opened this page with neither token nor tempLogin, optionally redirect to login
    if (!token && !tempLogin) {
      // No token & not temp-login — you might want to redirect to login
      // navigate("/"); // commented out (unobtrusive).
    }
  }, [token, tempLogin, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Token-based reset (existing flow)
  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    if (!form.newPassword || !form.confirmPassword) return alert("Fill both fields");
    if (form.newPassword !== form.confirmPassword) return alert("Passwords do not match");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Password changed. Please login.");
        navigate("/"); // go to login page
      } else {
        alert(data.message || "Failed to reset password.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Helper: navigate user to change-password page (the one that uses /api/change-password)
  // This expects the user to enter current password (temporary password) and new password.
  const goToChangePassword = () => {
    // We will pass account in query so change-password page can prefill the schoolName/username/email if you support it.
    navigate(`/change-password?account=${encodeURIComponent(account || (email || ""))}`);
  };

  return (
    <div className={styles.pageWrapper}>
      <div style={{ maxWidth: 480, margin: "60px auto", padding: 20 }}>
        {/* TEMP LOGIN UI */}
        {tempLogin && (
          <div>
            <h2>Temporary login detected</h2>
            <p>
              Account: <b>{account || email || "Unknown"}</b>
            </p>
            <div style={{ background: "#fff9e6", border: "1px solid #ffd07a", padding: 14, borderRadius: 6 }}>
              <p style={{ margin: 0 }}>
                You signed in using a <b>temporary one-time password</b>. For security, please set a permanent password now.
              </p>
            </div>

            <div style={{ marginTop: 16 }}>
              <p style={{ marginBottom: 6 }}>
                Next steps:
              </p>
              <ol style={{ paddingLeft: 18 }}>
                <li>Click <b>Change Password</b> below.</li>
                <li>On the Change Password screen, enter your <i>current password</i> (which is your temporary password sent by email) and choose a new password.</li>
                <li>After saving, you will use the new password for future logins.</li>
              </ol>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className={styles.submitBtn} onClick={goToChangePassword}>
                Go to Change Password
              </button>
              <button className={styles.logoutBtn} onClick={() => navigate("/")}>
                Back to Login
              </button>
            </div>
          </div>
        )}

        {/* TOKEN-BASED RESET UI (kept intact) */}
        {!tempLogin && (
          <div>
            <h2>Reset Password</h2>
            <p>Account: <b>{email || account || "Unknown"}</b></p>

            <form onSubmit={handleTokenSubmit} className={styles.form}>
              <input name="newPassword" type="password" placeholder="New password" value={form.newPassword} onChange={handleChange} required />
              <input name="confirmPassword" type="password" placeholder="Confirm new password" value={form.confirmPassword} onChange={handleChange} required />
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? "Saving..." : "Change Password"}
                </button>
                <button type="button" className={styles.logoutBtn} onClick={() => navigate("/")}>Cancel</button>
              </div>
            </form>

            <div style={{ marginTop: 14 }}>
              <small>If you reached this page after logging in with a temporary password, click <b>Back to Login</b> and then choose <i>Change Password</i> from your account area (or use the button above).</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
