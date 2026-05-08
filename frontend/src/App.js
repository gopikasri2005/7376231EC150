// App.js
import React, { useEffect, useState } from "react";

export default function App() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://4.224.186.213/evaluation-service/notifications", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",

        // Add token if API requires authorization
        // Authorization: "Bearer YOUR_TOKEN"
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching notifications:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Notifications</h1>

      {loading ? (
        <p>Loading...</p>
      ) : notifications.length === 0 ? (
        <p>No notifications found</p>
      ) : (
        notifications.map((item) => (
          <div key={item.ID} style={styles.card}>
            <h3 style={styles.type}>{item.Type}</h3>
            <p style={styles.message}>{item.Message}</p>
            <small style={styles.time}>{item.Timestamp}</small>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    fontFamily: "Arial",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },

  heading: {
    textAlign: "center",
    marginBottom: "20px",
  },

  card: {
    backgroundColor: "white",
    padding: "15px",
    marginBottom: "15px",
    borderRadius: "10px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },

  type: {
    color: "#007bff",
    marginBottom: "5px",
  },

  message: {
    fontSize: "16px",
    marginBottom: "8px",
  },

  time: {
    color: "gray",
  },
};