import React from "react";
import { 
  FaSchool, FaEnvelope, FaMapMarkerAlt, FaPhone, FaUserTie, FaGlobe, FaCalendarAlt, FaUsers 
} from "react-icons/fa";
import styles from "./SchoolInfo.module.css";


const SchoolInfo = ({ schoolInfo }) => {
  if (!schoolInfo) return <p className={styles.loading}>Loading school info...</p>;

  const { schoolName, schoolEmail, contactNumber, village, tehsil, district, pinCode } = schoolInfo;
  const fullAddress = `${village}, ${tehsil}, ${district} ${pinCode}`;
  const mapsSrc = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;

  return (
    <div className={styles.card}>
      <h2 className={styles.header}><FaSchool className={styles.headerIcon} /> School Information</h2>

      <div className={styles.infoGrid}>
        <div className={styles.leftColumn}>
          <p><FaSchool className={styles.icon} /> <strong>Name:</strong> {schoolName}</p>
          <p><FaEnvelope className={styles.icon} /> <strong>Email:</strong> {schoolEmail}</p>
          <p><FaPhone className={styles.icon} /> <strong>Contact:</strong> {contactNumber}</p>
          <p><FaMapMarkerAlt className={styles.icon} /> <strong>Address:</strong> {fullAddress}</p>
        </div>
        <div className={styles.rightColumn}>
          <p><FaUserTie className={styles.icon} /> <strong>Principal:</strong> John Doe</p>
          <p><FaCalendarAlt className={styles.icon} /> <strong>Established:</strong> 1995</p>
          <p><FaGlobe className={styles.icon} /> <strong>Website:</strong> www.example.com</p>
          <p><FaUsers className={styles.icon} /> <strong>Students:</strong> 1200</p>
          <p><FaUsers className={styles.icon} /> <strong>Teachers:</strong> 45</p>
        </div>
      </div>

      <div className={styles.mapContainer}>
        <iframe
          title="School Location"
          src={mapsSrc}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  );
};

export default SchoolInfo;
