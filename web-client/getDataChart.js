// Mengimpor mongoose dan model (asumsi model sudah dibuat)
const mongoose = require("mongoose");
const SensorData = require("./models/SensorRealTime"); // Gantilah dengan model yang sesuai

// Fungsi untuk mengambil data dalam 1 jam
const getDataForChart = async (deviceId) => {
  const oneHourAgo = new Date(Date.now() - 3600 * 1000); // 1 jam yang lalu

  try {
    const data = await SensorData.find({
      deviceId: deviceId,
      date: { $gte: oneHourAgo }, // Ambil data dari 1 jam terakhir
    }).sort({ date: 1 }); // Urutkan berdasarkan waktu

    // Format data untuk Chart.js
    const chartData = {
      labels: data.map((item) => item.date.toISOString()), // X axis: Tanggal
      datasets: [
        {
          label: "PM2",
          data: data.map((item) => parseFloat(item.pm2)), // Data PM2
          borderColor: "rgba(255, 99, 132, 1)",
          fill: false,
        },
        {
          label: "CO2",
          data: data.map((item) => parseFloat(item.co2)), // Data CO2
          borderColor: "rgba(54, 162, 235, 1)",
          fill: false,
        },
        {
          label: "SO2",
          data: data.map((item) => parseFloat(item.so2)), // Data SO2
          borderColor: "rgba(75, 192, 192, 1)",
          fill: false,
        },
        {
          label: "Temperature",
          data: data.map((item) => parseFloat(item.temperatur)), // Data Temperatur
          borderColor: "rgba(153, 102, 255, 1)",
          fill: false,
        },
      ],
    };

    return chartData;
  } catch (err) {
    console.error("Error fetching data:", err);
    return null;
  }
};

module.exports = getDataForChart;
