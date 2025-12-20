// TotalStudents.jsx
import React from "react";
import dashStyles from "./Dashboard.module.css";
import styles from "./TotalStudents.module.css";


/**
 * TotalStudents
 * Props:
 *  - totalStudents: number
 *  - students: array (optional)
 *  - renderStudentTable: () => ReactNode  (Dashboard's renderStudentTable function)
 *
 * This component intentionally uses the Dashboard styles for primary layout (dashStyles)
 * and its own module (styles) for any new small/optional tweaks.
 */
const TotalStudents = ({ totalStudents = 0, students = [], renderStudentTable }) => {
  return (
    <div className={dashStyles.box + (styles.root ? ` ${styles.root}` : "")}>
      <div className={dashStyles.boxHeader}>Total Students</div>

      <p><strong>Total students:</strong> {totalStudents}</p>

      {/* renderStudentTable is passed from Dashboard (keeps existing behavior) */}
      <div>
        {typeof renderStudentTable === "function" ? renderStudentTable() : (
          /* fallback if none provided - simple table */
          <div className={dashStyles.tableContainer}>
            {(!students || !students.length) ? <p>No student records.</p> : (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TotalStudents;
