// RegisterStudent.jsx
import React from "react";
// reuse the same dashboard styles to avoid needing new css edits
import styles from "./Dashboard.module.css";

/**
 * RegisterStudent
 * Props:
 *  - formData: object with registration fields
 *  - handleChange: (e) => void  (updates formData)
 *  - handleRegister: (e) => Promise<void> (submit handler)
 *
 * This component only renders the registration form and uses the same classes
 * from Dashboard.module.css so no CSS changes are required.
 */
const RegisterStudent = ({ formData, handleChange, handleRegister }) => {
  return (
    <div className={styles.box}>
      <div className={styles.boxHeader}>Register New Student</div>
      <form className={styles.form} onSubmit={handleRegister}>
        <input
          type="text"
          name="name"
          placeholder="Full Name*"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="motherName"
          placeholder="Mother Name"
          value={formData.motherName}
          onChange={handleChange}
        />
        <input
          type="text"
          name="motherTongue"
          placeholder="Mother Tongue"
          value={formData.motherTongue}
          onChange={handleChange}
        />
        <input
          type="text"
          name="raceCaste"
          placeholder="Race & Caste"
          value={formData.raceCaste}
          onChange={handleChange}
        />
        <input
          type="text"
          name="nationality"
          placeholder="Nationality"
          value={formData.nationality}
          readOnly
        />
        <input
          type="text"
          name="birthPlace"
          placeholder="Place of Birth"
          value={formData.birthPlace}
          onChange={handleChange}
        />
        <input
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="lastSchool"
          placeholder="Last School"
          value={formData.lastSchool}
          onChange={handleChange}
        />
        <input
          type="date"
          name="dateAdmission"
          value={formData.dateAdmission}
          onChange={handleChange}
        />
        <input
          type="text"
          name="standard"
          placeholder="Standard"
          value={formData.standard}
          onChange={handleChange}
        />
        <input
          type="text"
          name="progress"
          placeholder="Progress"
          value={formData.progress}
          onChange={handleChange}
        />
        <input
          type="text"
          name="conduct"
          placeholder="Conduct"
          value={formData.conduct}
          onChange={handleChange}
        />
        <input
          type="date"
          name="dateLeaving"
          value={formData.dateLeaving}
          onChange={handleChange}
        />
        <input
          type="text"
          name="reasonLeaving"
          placeholder="Reason for Leaving"
          value={formData.reasonLeaving}
          onChange={handleChange}
        />
        <input
          type="text"
          name="remark"
          placeholder="Remark"
          value={formData.remark}
          onChange={handleChange}
        />
        <button type="submit" className={styles.submitBtn}>Submit</button>
      </form>
    </div>
  );
};

export default RegisterStudent;
