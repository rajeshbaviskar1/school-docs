import React, { useState, useEffect } from "react";
import styles from "./SchoolLogin.module.css";
import { FaEye, FaEyeSlash, FaSchool } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../utils/api";



const SchoolLogin = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [sendingTemp, setSendingTemp] = useState(false);

  // Load saved credentials (Remember Me)
  useEffect(() => {
    const savedUsername = localStorage.getItem("savedUsername");
    const savedPassword = localStorage.getItem("savedPassword");

    if (savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  // Login Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Enter username and password");
      return;
    }

    try {
      const response = await fetch(
  `${API_BASE_URL}/api/login-school`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }
);


      const result = await response.json();

      if (response.ok) {
        alert(result.message);

        localStorage.setItem("schoolName", result.schoolName);
        localStorage.setItem(
  "role",
  (result.role || "").trim().toUpperCase()
); // 🔥 ADD THIS LINE


        if (result.tempLogin === true) {
          localStorage.setItem(
            "tempLoginUser",
            JSON.stringify({ username, ts: Date.now() })
          );
        } else {
          localStorage.removeItem("tempLoginUser");
        }

        if (rememberMe) {
          localStorage.setItem("savedUsername", username);
          localStorage.setItem("savedPassword", password);
        } else {
          localStorage.removeItem("savedUsername");
          localStorage.removeItem("savedPassword");
        }
        if (result.role === "PRINCIPAL") {
  navigate("/principal-dashboard");
} else {
  navigate("/dashboard");
}

      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Server error, try again later.");
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotEmail) {
      alert("Enter your registered email");
      return;
    }

    setSendingTemp(true);

    try {
      const response = await fetch(
  `${API_BASE_URL}/api/forgot-password`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: forgotEmail }),
  }
);


      let result = null;
      try {
        result = await response.json();
      } catch {}

      if (response.ok) {
        alert(
          (result && result.message) ||
            "If the email exists, a temporary password has been requested."
        );
        setShowForgot(false);
      } else {
        alert(
          (result && result.message) ||
            "Server error: Unable to request temporary password."
        );
      }
    } catch (err) {
      console.error(err);
      alert("Network/server error, try again later.");
    } finally {
      setSendingTemp(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <FaSchool size={32} color="#1E3A8A" />
          <span className={styles.schoolName}>MahaDigital School</span>
        </div>
      </header>

      <div className={styles.container}>
        {/* Login Box */}
        <div className={`${styles.box} ${styles.loginBox}`}>
          <div className={`${styles.boxHeader} ${styles.loginHeader}`}>
            <FaSchool /> User Login
          </div>

          <div className={styles.boxContent}>
            {!showForgot ? (
              <form onSubmit={handleSubmit}>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    placeholder="User ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.inputWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={styles.inputField}
                  />
                  <span
                    className={styles.showPasswordIcon}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                <div className={styles.options}>
                  <label>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                    />{" "}
                    Remember Me
                  </label>

                  <a
                    href="#"
                    className={styles.forgotLink}
                    onClick={() => setShowForgot(true)}
                  >
                    Forgot Password?
                  </a>
                </div>

                <button type="submit" className={styles.loginBtn}>
                  Login
                </button>

                <a href="/register" className={styles.registerBtn}>
                  Register School
                </a>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div className={styles.inputWrapper}>
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className={styles.inputField}
                  />
                </div>

                <button
                  type="submit"
                  className={styles.loginBtn}
                  disabled={sendingTemp}
                >
                  {sendingTemp ? "Sending…" : "Send Temporary Password"}
                </button>

                <a
                  href="#"
                  className={styles.forgotLink}
                  onClick={() => setShowForgot(false)}
                >
                  Back to Login
                </a>
              </form>
            )}
          </div>
        </div>

        {/* Highlight Box */}
        <div className={`${styles.box} ${styles.highlightBox}`}>
          <div className={`${styles.boxHeader} ${styles.highlightHeader}`}>
            Highlights
          </div>
          <div className={styles.boxContent}>
            <p>No highlights available</p>
          </div>
        </div>

        {/* Notice Box */}
        <div className={`${styles.box} ${styles.noticeBox}`}>
          <div className={`${styles.boxHeader} ${styles.noticeHeader}`}>
            Common Notice
          </div>
          <div className={styles.boxContent}>
            <p>No new notices available</p>
          </div>
        </div>
      </div>

      <div className={styles.bottomLinks}>
        <a href="/about" className={styles.bottomBtn}>
          About Us
        </a>
        <a href="/help" className={styles.bottomBtn}>
          Help?
        </a>
        <a href="/contact" className={styles.bottomBtn}>
          Contact Us
        </a>
      </div>

      <footer className={styles.footer}>
        © 2025 Maha-Digital Technology. All rights reserved
      </footer>
    </div>
  );
};

export default SchoolLogin;
