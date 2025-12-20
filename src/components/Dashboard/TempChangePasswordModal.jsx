// TempChangePasswordModal.jsx
import React, { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "./Dashboard.module.css";

/**
 * Props:
 * - open (bool)
 * - onClose({ success: bool })
 * - username (string)
 * - schoolName (string)
 */
const TempChangePasswordModal = ({ open, onClose, username, schoolName }) => {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!open) {
      setForm({ newPassword: "", confirmPassword: "" });
      setShowNew(false);
      setShowConfirm(false);
      setLoading(false);
      setError("");
      setSuccessMsg("");
    }
  }, [open]);

  if (!open) return null;

  const idLabel = username || schoolName || "your account";

  const handleChange = (e) => {
    setError("");
    setSuccessMsg("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.newPassword || !form.confirmPassword) {
      setError("Please fill both fields.");
      return false;
    }
    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return false;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        username: username || undefined,
        schoolName: schoolName || undefined,
        newPassword: form.newPassword,
      };

      const res = await fetch("http://localhost:5000/api/change-password-temp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to set password.");
        setLoading(false);
        return;
      }

      // success
      try { localStorage.removeItem("tempLoginUser"); } catch (e) {}
      setSuccessMsg(data.message || "Password updated successfully.");
      setLoading(false);

      setTimeout(() => {
        onClose && onClose({ success: true });
      }, 800);
    } catch (err) {
      console.error("Temp change error:", err);
      setError("Server error. Try again later.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.tcp_overlay}>
      <div className={`${styles.tcp_card} ${styles.tcp_enter}`}>
        <div className={styles.tcp_header}>
          Create a new password
        </div>

        <div className={styles.tcp_body}>
          <p className={styles.tcp_desc}>
            You signed in using a <strong>temporary password</strong> for account: <strong>{idLabel}</strong>. For security, set a permanent password now.
          </p>

          {error && <div className={styles.tcp_error}>{error}</div>}
          {successMsg && <div className={styles.tcp_success}>{successMsg}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.tcp_field}>
              <input
                name="newPassword"
                type={showNew ? "text" : "password"}
                placeholder="New password (min 6 chars)"
                value={form.newPassword}
                onChange={handleChange}
                className={styles.tcp_input}
                required
              />
              <button type="button" onClick={() => setShowNew(s => !s)} className={styles.tcp_iconBtn} aria-label="Toggle new password">
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className={styles.tcp_field}>
              <input
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={handleChange}
                className={styles.tcp_input}
                required
              />
              <button type="button" onClick={() => setShowConfirm(s => !s)} className={styles.tcp_iconBtn} aria-label="Toggle confirm password">
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className={styles.tcp_footer}>
              <button
                type="button"
                onClick={() => { try { localStorage.removeItem("tempLoginUser"); } catch (e) {} ; onClose && onClose({ success: false }); }}
                disabled={loading}
                className={styles.tcp_btnSecondary}
              >
                Cancel
              </button>

              <button type="submit" disabled={loading} className={styles.tcp_btnPrimary}>
                {loading ? <span className={styles.tcp_spinner} aria-hidden="true" /> : "Save new password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TempChangePasswordModal;
