// db.js (safe migration + LC approval support)
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Connect to SQLite DB
const dbPath = path.resolve(__dirname, "school.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error connecting to database:", err.message);
  } else {
    console.log("✅ SQLite database connected");
  }
});

// Helper: ensure a column exists on a table, add it if missing
function ensureColumn(tableName, columnName, columnDef, cb) {
  db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
    if (err) {
      console.error(`❌ PRAGMA ${tableName} error:`, err.message);
      if (cb) cb(err);
      return;
    }
    const has = rows.some(
      r => String(r.name).toLowerCase() === String(columnName).toLowerCase()
    );
    if (has) {
      console.log(`ℹ️ Column '${columnName}' already exists on ${tableName}`);
      if (cb) cb(null, false);
      return;
    }
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`, (addErr) => {
      if (addErr) {
        console.error(
          `❌ Failed to add column ${columnName} to ${tableName}:`,
          addErr.message
        );
        if (cb) cb(addErr);
        return;
      }
      console.log(`✅ Column '${columnName}' added to ${tableName}`);
      if (cb) cb(null, true);
    });
  });
}

db.serialize(() => {

  // --- UsersLogin table ---
  db.run(`
    CREATE TABLE IF NOT EXISTS UsersLogin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schoolName TEXT NOT NULL,
      principalName TEXT NOT NULL,
      schoolEmail TEXT NOT NULL UNIQUE,
      principalEmail TEXT NOT NULL,
      village TEXT NOT NULL,
      tehsil TEXT NOT NULL,
      district TEXT NOT NULL,
      pinCode TEXT NOT NULL,
      boardName TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error("❌ Error creating UsersLogin table:", err.message);
    else console.log("✅ UsersLogin table ensured");
  });

  // temp password columns (safe migration)
  ensureColumn(
    "UsersLogin",
    "temp_password_hash",
    "temp_password_hash TEXT"
  );
  ensureColumn(
    "UsersLogin",
    "temp_password_expires_at",
    "temp_password_expires_at DATETIME"
  );

  // --- StudentDetails table ---
  db.run(`
    CREATE TABLE IF NOT EXISTS StudentDetails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schoolName TEXT NOT NULL,
      name TEXT NOT NULL,
      motherName TEXT,
      motherTongue TEXT,
      raceCaste TEXT,
      nationality TEXT DEFAULT 'Indian',
      birthPlace TEXT,
      dob TEXT,
      lastSchool TEXT,
      dateAdmission TEXT,
      standard TEXT,
      progress TEXT,
      conduct TEXT,
      dateLeaving TEXT,
      reasonLeaving TEXT,
      remark TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error("❌ Error creating StudentDetails table:", err.message);
    else console.log("✅ StudentDetails table ensured");
  });

  // --- LeavingCertificates table (LC approval workflow) ---
  db.run(`
    CREATE TABLE IF NOT EXISTS LeavingCertificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      studentId INTEGER NOT NULL,
      schoolName TEXT NOT NULL,

      status TEXT CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED'))
             DEFAULT 'PENDING',

      requestedBy TEXT NOT NULL,
      requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

      approvedBy TEXT,
      approvedAt DATETIME,

      rejectionReason TEXT,

      FOREIGN KEY (studentId) REFERENCES StudentDetails(id)
    )
  `, (err) => {
    if (err) {
      console.error("❌ Error creating LeavingCertificates table:", err.message);
    } else {
      console.log("✅ LeavingCertificates table ensured");
    }
  });

  // --- EmailQueue (optional helper table) ---
  db.run(`
    CREATE TABLE IF NOT EXISTS EmailQueue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      toEmail TEXT NOT NULL,
      tempPassword TEXT,
      status TEXT DEFAULT 'pending',
      attemptCount INTEGER DEFAULT 0,
      lastError TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error("❌ Error creating EmailQueue table:", err.message);
    else console.log("✅ EmailQueue table ensured (optional)");
  });

});

module.exports = db;
