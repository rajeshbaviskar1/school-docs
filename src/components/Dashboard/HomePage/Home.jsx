import React, { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import styles from "./Home.module.css";


const Home = () => {
  const totalStudents = 1200;
  const studentData = [
    { name: "Boys", value: 700 },
    { name: "Girls", value: 480 },
    { name: "Transgender", value: 20 },
  ];
  const COLORS = ["#0088FE", "#FF69B4", "#8A2BE2"];

  const [barInterval, setBarInterval] = useState("day");
  const [barData, setBarData] = useState([]);

  useEffect(() => {
    let data = [];
    if (barInterval === "day") {
      data = [
        { name: "Mon", Issued: 5 },
        { name: "Tue", Issued: 8 },
        { name: "Wed", Issued: 3 },
        { name: "Thu", Issued: 6 },
        { name: "Fri", Issued: 7 },
      ];
    } else if (barInterval === "month") {
      data = [
        { name: "Jan", Issued: 50 },
        { name: "Feb", Issued: 80 },
        { name: "Mar", Issued: 70 },
        { name: "Apr", Issued: 60 },
        { name: "May", Issued: 90 },
      ];
    } else {
      data = [
        { name: "2022", Issued: 500 },
        { name: "2023", Issued: 750 },
        { name: "2024", Issued: 900 },
      ];
    }
    setBarData(data);
  }, [barInterval]);

  return (
    <div className={styles.homeContainer}>
      <h2 className={styles.dashboardTitle}>Dashboard Overview</h2>

      <div className={styles.chartsRow}>
        {/* Pie Chart */}
        <div className={styles.chartWrapper}>
          <h3 className={styles.chartTitle}>Student Distribution</h3>
          <div className={styles.chartInner}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={studentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={90}
                  dataKey="value"
                >
                  {studentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className={styles.chartWrapper}>
          <h3 className={styles.chartTitle}>Leaving Certificates Issued</h3>
          <div className={styles.barToggle}>
            <button
              className={barInterval === "day" ? styles.activeToggle : ""}
              onClick={() => setBarInterval("day")}
            >Day</button>
            <button
              className={barInterval === "month" ? styles.activeToggle : ""}
              onClick={() => setBarInterval("month")}
            >Month</button>
            <button
              className={barInterval === "year" ? styles.activeToggle : ""}
              onClick={() => setBarInterval("year")}
            >Year</button>
          </div>
          <div className={styles.chartInner}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
                <Bar dataKey="Issued" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
