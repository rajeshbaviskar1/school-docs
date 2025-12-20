// server.js (replace your current file with this)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
/*const nodemailer = require("nodemailer");*/
const sgMail = require("@sendgrid/mail");

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("⚠️ SENDGRID_API_KEY not set");
}
console.log("SENDGRID_API_KEY loaded:", !!process.env.SENDGRID_API_KEY);

const rateLimit = require("express-rate-limit");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// rate limiter (for forgot password)
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: { message: "Too many reset attempts from this IP, try again later." },
});


async function sendTempPasswordEmail(toEmail, tempPassword, expiryMinutes) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SendGrid API key missing");
    return { sent: false, info: "SendGrid not configured" };
  }

  const msg = {
    to: toEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: "MahaDigital School - Temporary login password",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>MahaDigital School</h2>
        <p>Your temporary password is:</p>
        <p style="font-size:18px;"><b>${tempPassword}</b></p>
        <p>This password is valid for <b>${expiryMinutes} minutes</b>.</p>
        <p>Please change your password after login.</p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Temp password email sent via SendGrid");
    return { sent: true };
  } catch (err) {
    console.error("❌ SendGrid error:", err.response?.body || err.message);
    return { sent: false, info: err.message };
  }
}




// ----------------- REGISTER SCHOOL -----------------
app.post("/api/register-school", async (req, res) => {
  try {
    const {
      schoolName,
      principalName,
      schoolEmail,
      principalEmail,
      village,
      tehsil,
      district,
      pinCode,
      boardName,
      username,
      password,
    } = req.body;

    if (!username || !password) return res.status(400).json({ message: "Username and password required" });

    db.get(
      "SELECT * FROM UsersLogin WHERE username = ? OR schoolEmail = ?",
      [username, schoolEmail],
      async (err, existingUser) => {
        if (err) {
          console.error("DB lookup error:", err);
          return res.status(500).json({ message: "DB error" });
        }
        if (existingUser) {
          return res.status(400).json({ message: "Username or Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
          `INSERT INTO UsersLogin
           (schoolName, principalName, schoolEmail, principalEmail, village, tehsil, district, pinCode, boardName, username, password)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [schoolName, principalName, schoolEmail, principalEmail, village, tehsil, district, pinCode, boardName, username, hashedPassword],
          function (insertErr) {
            if (insertErr) {
              console.error("DB insert error:", insertErr);
              return res.status(500).json({ message: "DB error on insert" });
            }
            return res.status(200).json({ message: "School registered successfully!" });
          }
        );
      }
    );
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ----------------- LOGIN SCHOOL -----------------
app.post("/api/login-school", async (req, res) => {
  try {
    console.log("👉 LOGIN REQUEST BODY:", req.body);
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username and password required" });

    db.get("SELECT * FROM UsersLogin WHERE username = ?", [username], async (err, user) => { console.log("👉 DB USER:", user);
      if (err) {
        console.error("DB error", err);
        return res.status(500).json({ message: "DB error" });
      }
      if (!user) return res.status(400).json({ message: "Invalid username or password" });

      // check primary password
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return res.status(200).json({ message: "Login successful!", schoolName: user.schoolName, role: user.role });
      }

      // if primary failed, check temp password (if present and not expired)
      if (user.temp_password_hash && user.temp_password_expires_at) {
        const now = new Date();
        const expiresAt = new Date(user.temp_password_expires_at);
        if (now <= expiresAt) {
          const isTempMatch = await bcrypt.compare(password, user.temp_password_hash);
          if (isTempMatch) {
            // NOTE: keep temp password valid until it naturally expires (do not clear here)
            return res.status(200).json({
              message: "Login successful (temp password)!",
              schoolName: user.schoolName,
              tempLogin: true,
              role: user.role,
              tempPasswordExpiresAt: user.temp_password_expires_at
            });
          }
        }
      }

      return res.status(400).json({ message: "Invalid username or password" });
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ----------------- GET SCHOOL INFO -----------------
app.get("/api/school-info/:schoolName", (req, res) => {
  const { schoolName } = req.params;
  db.get("SELECT * FROM UsersLogin WHERE schoolName = ?", [schoolName], (err, row) => {
    if (err) {
      console.error("DB error", err);
      return res.status(500).json({ message: "DB error" });
    }
    if (!row) return res.status(404).json({ message: "School not found" });
    return res.status(200).json(row);
  });
});

// ----------------- REGISTER STUDENT -----------------
/**
 * POST /api/register-student
 * Body:
 *  - schoolName (required)  <-- server will validate existence
 *  - name, motherName, motherTongue, raceCaste, nationality, birthPlace,
 *    dob, lastSchool, dateAdmission, standard, progress, conduct,
 *    dateLeaving, reasonLeaving, remark
 *
 * Security note: this endpoint ties the student to `schoolName`. For stronger protection
 * you should later add authenticated sessions / JWT so a client cannot forge another school's name.
 */
app.post("/api/register-student", async (req, res) => {
  try {
    const {
      schoolName,
      name,
      motherName,
      motherTongue,
      raceCaste,
      nationality,
      birthPlace,
      dob,
      lastSchool,
      dateAdmission,
      standard,
      progress,
      conduct,
      dateLeaving,
      reasonLeaving,
      remark
    } = req.body;

    if (!schoolName || !name) {
      return res.status(400).json({ message: "schoolName and name are required" });
    }

    // verify school exists
    db.get("SELECT id FROM UsersLogin WHERE schoolName = ?", [schoolName], (err, userRow) => {
      if (err) {
        console.error("DB error when verifying school:", err);
        return res.status(500).json({ message: "DB error" });
      }
      if (!userRow) {
        return res.status(400).json({ message: "Invalid schoolName" });
      }

      // insert student record tied to schoolName
      db.run(
        `INSERT INTO StudentDetails
         (schoolName, name, motherName, motherTongue, raceCaste, nationality, birthPlace, dob,
          lastSchool, dateAdmission, standard, progress, conduct, dateLeaving, reasonLeaving, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          schoolName,
          name,
          motherName || null,
          motherTongue || null,
          raceCaste || null,
          nationality || null,
          birthPlace || null,
          dob || null,
          lastSchool || null,
          dateAdmission || null,
          standard || null,
          progress || null,
          conduct || null,
          dateLeaving || null,
          reasonLeaving || null,
          remark || null
        ],
        function (insertErr) {
          if (insertErr) {
            console.error("DB insert student error:", insertErr);
            return res.status(500).json({ message: "Failed to register student" });
          }

          return res.status(200).json({ message: "Student registered", id: this.lastID });
        }
      );

    });
  } catch (err) {
    console.error("register-student error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ----------------- GET STUDENTS (for a school) -----------------
/**
 * GET /api/get-students?schoolName=...
 * Returns all student records for that schoolName.
 */
app.get("/api/get-students", (req, res) => {
  try {
    const schoolName = req.query.schoolName;
    if (!schoolName) return res.status(400).json({ message: "Missing schoolName query param" });

    // ensure school exists (optional but safer)
    db.get("SELECT id FROM UsersLogin WHERE schoolName = ?", [schoolName], (err, userRow) => {
      if (err) {
        console.error("DB error when verifying school:", err);
        return res.status(500).json({ message: "DB error" });
      }
      if (!userRow) {
        return res.status(400).json({ message: "Invalid schoolName" });
      }

      db.all("SELECT * FROM StudentDetails WHERE schoolName = ? ORDER BY id DESC", [schoolName], (qerr, rows) => {
        if (qerr) {
          console.error("DB get-students error:", qerr);
          return res.status(500).json({ message: "Failed to load student records" });
        }
        return res.status(200).json({ students: rows, count: rows.length });
      });
    });
  } catch (err) {
    console.error("get-students error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ----------------- SEARCH STUDENT FOR LEAVING CERTIFICATE -----------------
/**
 * GET /api/search-leaving-student?name=...&standard=...&schoolName=...
 *
 * - For now we search StudentDetails table by schoolName + name (partial match)
 * - Returns { success, student, list } where `student` is first match and `list` all matches
 */
app.get("/api/search-leaving-student", (req, res) => {
  try {
    const { name, standard, schoolName } = req.query;

    if (!schoolName) {
      return res.status(400).json({ success: false, message: "schoolName is required" });
    }

    if (!name && !standard) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least name or standard."
      });
    }

    // Build dynamic SQL against StudentDetails table
    // Use COALESCE so LOWER() won't receive NULL and crash on some setups
    let sql = `SELECT * FROM StudentDetails WHERE schoolName = ?`;
    const params = [schoolName];

    if (name) {
      sql += " AND LOWER(COALESCE(name, '')) LIKE ?";
      params.push(`%${String(name).toLowerCase()}%`);
    }

    if (standard) {
      sql += " AND LOWER(COALESCE(standard, '')) LIKE ?";
      params.push(`%${String(standard).toLowerCase()}%`);
    }

    // ORDER BY id DESC to avoid relying on optional createdAt column
    sql += " ORDER BY id DESC";

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error("DB error:", err);
        // return error details for easier debugging in dev
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message || String(err)
        });
      }

      if (!rows || rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No student found"
        });
      }

      // return first match and full list
      return res.json({
        success: true,
        student: rows[0],
        list: rows
      });
    });

  } catch (e) {
    console.error("Search LC error:", e);
    res.status(500).json({ success: false, message: "Server error", error: e.message || String(e) });
  }
});

// ----------------- CHANGE PASSWORD -----------------
// (kept unchanged — same logic as before)
app.post("/api/change-password", async (req, res) => {
  try {
    const { schoolName, username, currentPassword, newPassword } = req.body;
    if ((!schoolName && !username) || !currentPassword || !newPassword) return res.status(400).json({ message: "Required fields missing" });

    const findQuery = schoolName ? "SELECT * FROM UsersLogin WHERE schoolName = ?" : "SELECT * FROM UsersLogin WHERE username = ?";
    const findVal = schoolName ? schoolName : username;

    db.get(findQuery, [findVal], async (err, user) => {
      if (err) {
        console.error("DB error", err);
        return res.status(500).json({ message: "DB error" });
      }
      if (!user) return res.status(404).json({ message: "User not found" });

      const matchPrimary = await bcrypt.compare(currentPassword, user.password);

      let matchTemp = false;
      if (!matchPrimary && user.temp_password_hash && user.temp_password_expires_at) {
        const now = new Date();
        const expiresAt = new Date(user.temp_password_expires_at);
        if (now <= expiresAt) {
          matchTemp = await bcrypt.compare(currentPassword, user.temp_password_hash);
        } else {
          db.run("UPDATE UsersLogin SET temp_password_hash = NULL, temp_password_expires_at = NULL WHERE id = ?", [user.id], (uerr) => {
            if (uerr) console.error("Failed to clear expired temp password:", uerr);
          });
        }
      }

      if (!matchPrimary && !matchTemp) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      db.run("UPDATE UsersLogin SET password = ?, temp_password_hash = NULL, temp_password_expires_at = NULL WHERE id = ?", [hashed, user.id], function (updateErr) {
        if (updateErr) {
          console.error("Update password error", updateErr);
          return res.status(500).json({ message: "Failed to update password" });
        }
        return res.status(200).json({ message: "Password changed successfully" });
      });
    });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ----------------- CHANGE PASSWORD (temp-login flow: set new password without current) -----------------
app.post("/api/change-password-temp", async (req, res) => {
  try {
    const { username, schoolName, newPassword } = req.body;
    if ((!username && !schoolName) || !newPassword) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const lookupField = username ? "username" : "schoolName";
    const lookupVal = username || schoolName;

    db.get(`SELECT * FROM UsersLogin WHERE ${lookupField} = ?`, [lookupVal], async (err, user) => {
      if (err) {
        console.error("DB error", err);
        return res.status(500).json({ message: "DB error" });
      }
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const hashed = await bcrypt.hash(newPassword, 10);

      db.run(
        "UPDATE UsersLogin SET password = ?, temp_password_hash = NULL, temp_password_expires_at = NULL WHERE id = ?",
        [hashed, user.id],
        function (updateErr) {
          if (updateErr) {
            console.error("Update password error", updateErr);
            return res.status(500).json({ message: "Failed to update password" });
          }
          return res.status(200).json({ message: "Password changed successfully (temp flow)" });
        }
      );
    });
  } catch (err) {
    console.error("Change password (temp) error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ----------------- FORGOT PASSWORD (temporary password flow) -----------------
app.post("/api/forgot-password", forgotLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    db.get("SELECT * FROM UsersLogin WHERE schoolEmail = ?", [email], async (err, user) => {
      if (err) {
        console.error("DB error", err);
        return res.status(500).json({ message: "DB error" });
      }
      if (!user) return res.status(400).json({ message: "Email not found" });

      // generate a temporary password with letters, numbers and symbols
      function generateTempPassword(length = 8) {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_+=?";
        let out = "";
        const bytes = crypto.randomBytes(length);
        for (let i = 0; i < length; i++) {
          out += charset[bytes[i] % charset.length];
        }
        return out;
      }

      const tempPassword = generateTempPassword(8);
      const hashedTemp = await bcrypt.hash(tempPassword, 10);

      const expiryMinutes = Number(process.env.TEMP_PASSWORD_EXPIRY_MINUTES || 10);
      const expiresAt = new Date(Date.now() + expiryMinutes * 60000).toISOString();

      // store temp password hash & expiry on the user record (this overwrites existing temp password)
      db.run(
        "UPDATE UsersLogin SET temp_password_hash = ?, temp_password_expires_at = ? WHERE id = ?",
        [hashedTemp, expiresAt, user.id],
        async function (updateErr) {
          if (updateErr) {
            console.error("Failed to store temporary password:", updateErr);
            return res.status(500).json({ message: "Failed to create temporary password" });
          }

          console.log(`Generated temp password for user id=${user.id} email=${email} expiresAt=${expiresAt}`);

          // send the temp password via email
          const emailResult = await sendTempPasswordEmail(email, tempPassword, expiryMinutes);

          if (emailResult.sent) {
            console.log("✅ Temp password email sent via SendGrid");
            return res.status(200).json({ message: `Temporary password sent to ${email}. It is valid for ${expiryMinutes} minutes.` });
          } else {
            console.warn("Email not sent; returning temp password in response (dev fallback):", emailResult.info);
            return res.status(200).json({
              message: `Temporary password (dev): Use this password to sign in within ${expiryMinutes} minutes.`,
              tempPassword,
              expiryMinutes
            });
          }
        }
      );

    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ================= LC APPROVAL APIs =================

// 1️⃣ Clerk requests Leaving Certificate
// 1️⃣ Clerk requests Leaving Certificate
app.post("/api/lc/request", (req, res) => {
  const { studentId, schoolName, requestedBy } = req.body;

  if (!studentId || !schoolName || !requestedBy) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  db.get(
    `SELECT id, status FROM LeavingCertificates WHERE studentId = ?`,
    [studentId],
    (err, row) => {
      if (err) {
        console.error("LC request check error:", err);
        return res.status(500).json({ message: "DB error" });
      }

      // 🚫 If PENDING or APPROVED → block
      if (row && (row.status === "PENDING" || row.status === "APPROVED")) {
        return res.status(400).json({
          message: `LC already ${row.status} for this student`
        });
      }

      // ✅ If REJECTED → delete old record first
      const deleteRejected = (callback) => {
        if (row && row.status === "REJECTED") {
          db.run(
            `DELETE FROM LeavingCertificates WHERE studentId = ?`,
            [studentId],
            callback
          );
        } else {
          callback();
        }
      };

      deleteRejected((deleteErr) => {
        if (deleteErr) {
          console.error("Delete rejected LC error:", deleteErr);
          return res.status(500).json({ message: "Failed to reset rejected LC" });
        }

        // ✅ Insert new LC request
        db.run(
          `INSERT INTO LeavingCertificates 
           (studentId, schoolName, requestedBy)
           VALUES (?, ?, ?)`,
          [studentId, schoolName, requestedBy],
          function (insertErr) {
            if (insertErr) {
              console.error("LC request insert error:", insertErr);
              return res.status(500).json({ message: "Failed to request LC" });
            }

            return res.status(200).json({
              message: "LC requested successfully",
              lcId: this.lastID
            });
          }
        );
      });
    }
  );
});




// 2️⃣ Principal views all pending LC requests
app.get("/api/lc/pending", (req, res) => {
  const { schoolName } = req.query;

  if (!schoolName) {
    return res.status(400).json({ message: "schoolName is required" });
  }

  db.all(
    `
    SELECT 
      lc.id AS lcId,
      lc.status,
      lc.requestedBy,
      lc.requestedAt,
      s.id AS studentId,
      s.name,
      s.standard
    FROM LeavingCertificates lc
    JOIN StudentDetails s ON s.id = lc.studentId
    WHERE lc.schoolName = ?
      AND lc.status = 'PENDING'
    ORDER BY lc.requestedAt DESC
    `,
    [schoolName],
    (err, rows) => {
      if (err) {
        console.error("Fetch pending LC error:", err);
        return res.status(500).json({ message: "Failed to load pending LC list" });
      }

      return res.status(200).json({ pendingLCs: rows });
    }
  );
});


// 3️⃣ Principal approves LC
app.post("/api/lc/approve", (req, res) => {
  const { lcId, approvedBy } = req.body;

  if (!lcId || !approvedBy) {
    return res.status(400).json({ message: "lcId and approvedBy required" });
  }

  db.run(
    `
    UPDATE LeavingCertificates
    SET status = 'APPROVED',
        approvedBy = ?,
        approvedAt = CURRENT_TIMESTAMP,
        rejectionReason = NULL
    WHERE id = ? AND status = 'PENDING'
    `,
    [approvedBy, lcId],
    function (err) {
      if (err) {
        console.error("Approve LC error:", err);
        return res.status(500).json({ message: "Failed to approve LC" });
      }
      if (this.changes === 0) {
        return res.status(400).json({ message: "LC not found or already processed" });
      }

      return res.status(200).json({ message: "LC approved successfully" });
    }
  );
});


// 4️⃣ Principal rejects LC
app.post("/api/lc/reject", (req, res) => {
  const { lcId, approvedBy, rejectionReason } = req.body;

  if (!lcId || !approvedBy || !rejectionReason) {
    return res.status(400).json({ message: "lcId, approvedBy and rejectionReason required" });
  }

  db.run(
    `
    UPDATE LeavingCertificates
    SET status = 'REJECTED',
        approvedBy = ?,
        approvedAt = CURRENT_TIMESTAMP,
        rejectionReason = ?
    WHERE id = ? AND status = 'PENDING'
    `,
    [approvedBy, rejectionReason, lcId],
    function (err) {
      if (err) {
        console.error("Reject LC error:", err);
        return res.status(500).json({ message: "Failed to reject LC" });
      }
      if (this.changes === 0) {
        return res.status(400).json({ message: "LC not found or already processed" });
      }

      return res.status(200).json({ message: "LC rejected successfully" });
    }
  );
});

// 5️⃣ Get ALL LC records (for DocumentStatus)
app.get("/api/lc/all", (req, res) => {
  const { schoolName } = req.query;

  if (!schoolName) {
    return res.status(400).json({ message: "schoolName is required" });
  }

  db.all(
    `
    SELECT 
      lc.id AS lcId,
      lc.status,
      lc.requestedAt,
      lc.approvedAt,
      s.name,
      s.standard
    FROM LeavingCertificates lc
    JOIN StudentDetails s ON s.id = lc.studentId
    WHERE lc.schoolName = ?
    ORDER BY lc.requestedAt DESC
    `,
    [schoolName],
    (err, rows) => {
      if (err) {
        console.error("Fetch all LC error:", err);
        return res.status(500).json({ message: "Failed to fetch LC records" });
      }

      return res.status(200).json({
        records: rows,
      });
    }
  );
});



const PDFDocument = require("pdfkit");

// 6️⃣ Download Leaving Certificate (PDF)
app.get("/api/lc/download/:lcId", (req, res) => {
  const { lcId } = req.params;

  db.get(
    `
    SELECT 
      lc.id AS lcId,
      lc.status,
      lc.approvedAt,
      s.name,
      s.standard,
      s.schoolName
    FROM LeavingCertificates lc
    JOIN StudentDetails s ON s.id = lc.studentId
    WHERE lc.id = ? AND lc.status = 'APPROVED'
    `,
    [lcId],
    (err, row) => {
      if (err) {
        console.error("LC download error:", err);
        return res.status(500).json({ message: "DB error" });
      }

      if (!row) {
        return res.status(404).json({
          message: "Approved Leaving Certificate not found",
        });
      }

      // Create PDF
      const doc = new PDFDocument({ size: "A4", margin: 50 });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Leaving_Certificate_${row.name.replace(
          /\s+/g,
          "_"
        )}.pdf`
      );
      res.setHeader("Content-Type", "application/pdf");

      doc.pipe(res);

      // PDF Content
      doc
        .fontSize(18)
        .text("Leaving Certificate", { align: "center" })
        .moveDown(2);

      doc.fontSize(12);
      doc.text(`School Name: ${row.schoolName}`);
      doc.moveDown();

      doc.text(`Student Name: ${row.name}`);
      doc.text(`Standard: ${row.standard}`);
      doc.text(
        `Approved On: ${new Date(row.approvedAt).toLocaleDateString()}`
      );

      doc.moveDown(2);

      doc.text(
        "This is to certify that the above student has left the school after completing all formalities."
      );

      doc.moveDown(4);

      doc.text("Principal / Headmaster", { align: "left" });
      doc.text("Signature", { align: "left" });

      doc.end();
    }
  );
});





// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});




