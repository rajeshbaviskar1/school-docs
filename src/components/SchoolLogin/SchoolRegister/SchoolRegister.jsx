import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "./SchoolRegister.module.css";
import API_BASE_URL from "../../../utils/api";

const SchoolRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    schoolName: "",
    principalName: "",
    schoolEmail: "",
    principalEmail: "",
    village: "",
    tehsil: "",
    district: "",
    pinCode: "",
    boardName: "",
    username: "",
    password: "",
    rePassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateUsername = (username) => username.includes(".");
  const validatePassword = (password) =>
    /^(?=.*[0-9])(?=.*[@#$]).{8,}$/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // validation (same as you had)
    let tempErrors = {};
    if (!validateUsername(formData.username)) {
      tempErrors.username = "Username must include a dot (e.g., user.details)";
    }
    if (!validatePassword(formData.password)) {
      tempErrors.password =
        "Password must be 8+ characters and include a number and one special character (@, #, $).";
    }
    if (formData.password !== formData.rePassword) {
      tempErrors.rePassword = "Passwords do not match";
    }

    setErrors(tempErrors);
    if (Object.keys(tempErrors).length > 0) return;

    try {
      setLoading(true);

      // IMPORTANT: use an absolute backend URL (not a relative path)
      const response = await fetch(`${API_BASE_URL}/api/register-school`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData),
      });

      // parse JSON (handle if server returns text/html on error)
      let result;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        result = await response.json();
      } else {
        result = { message: await response.text() };
      }

      if (response.ok) {
        alert(result.message || "Registered successfully");
        navigate("/");
      } else {
        alert(result.message || "Registration failed");
      }
    } catch (err) {
      console.error("Register error:", err);
      alert("Server error, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <span className={styles.schoolName}>Maha Digital School</span>
        </div>
      </header>

      <div className={styles.container}>
        <div className={`${styles.box} ${styles.registerBox}`}>
          <div className={`${styles.boxHeader} ${styles.registerHeader}`}>Register School</div>
          <div className={styles.boxContent}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formCol}>
                  <input
                    type="text"
                    name="schoolName"
                    placeholder="School Name"
                    value={formData.schoolName}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="principalName"
                    placeholder="School Principal Name"
                    value={formData.principalName}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="email"
                    name="schoolEmail"
                    placeholder="School Email ID"
                    value={formData.schoolEmail}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="email"
                    name="principalEmail"
                    placeholder="Principal Email ID"
                    value={formData.principalEmail}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="village"
                    placeholder="Village"
                    value={formData.village}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="tehsil"
                    placeholder="Tehsil"
                    value={formData.tehsil}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formCol}>
                  <input
                    type="text"
                    name="district"
                    placeholder="District"
                    value={formData.district}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="pinCode"
                    placeholder="Pin Code"
                    value={formData.pinCode}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="boardName"
                    placeholder="Board Name"
                    value={formData.boardName}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="username"
                    placeholder="Username (user.details)"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                  {errors.username && <p className={styles.errorMsg}>{errors.username}</p>}

                  <div className={styles.passwordWrapper}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <span
                      className={styles.eyeIcon}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                    <span className={styles.infoIcon} title="Password must be 8+ characters and include @, #, or $ and a number.">ℹ️</span>
                  </div>

                  {errors.password && <p className={styles.errorMsg}>{errors.password}</p>}

                  <div className={styles.passwordWrapper}>
                    <input
                      type={showRePassword ? "text" : "password"}
                      name="rePassword"
                      placeholder="Re-enter Password"
                      value={formData.rePassword}
                      onChange={handleChange}
                      required
                    />
                    <span
                      className={styles.eyeIcon}
                      onClick={() => setShowRePassword(!showRePassword)}
                    >
                      {showRePassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                  {errors.rePassword && <p className={styles.errorMsg}>{errors.rePassword}</p>}
                </div>
              </div>

              <button type="submit" className={styles.registerBtn} disabled={loading}>
                {loading ? "Registering..." : "Register School"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className={styles.bottomLinks}>
        <a href="/" className={styles.bottomBtn}>Back to Login</a>
      </div>

      <footer className={styles.footer}>© 2025 Maha-Digital Technology. All rights reserved</footer>
    </div>
  );
};

export default SchoolRegister;
