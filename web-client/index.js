const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const getDataForChart = require("./getDataChart"); // Fungsi untuk mendapatkan data
const cors = require("cors");
const SensorRealTime = require("./models/SensorRealTime"); // Gantilah dengan model yang sesuai
const SensorHour = require("./models/SensorHour"); // Gantilah dengan model yang sesuai
const sensor15Minutes = require("./models/Sensor15Minutes");
const Sensor15Minutes = require("./models/Sensor15Minutes");

const app = express();
const PORT = 9001;

const url_ma = "";

// Koneksi MongoDB menggunakan Mongoose
mongoose
  .connect(url_ma)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));

// Middleware untuk melayani file statis
app.use(express.static(path.join(__dirname, "public")));
app.use(cors()); // Mengizinkan permintaan dari frontend
app.use(express.json());
// Rute untuk mendapatkan data chart berdasarkan deviceId
app.get("/api/sensors/realtime/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  console.log("get realtime data:", deviceId);
  const fiveMinuteAgo = new Date(Date.now() - 5 * 60 * 1000); // 1 jam yang lalu
  const chartData = await SensorRealTime.find({
    deviceId: deviceId,
    date: { $gte: fiveMinuteAgo }, // Ambil data dari 1 jam terakhir
  }).sort({ date: 1 });
  // const chartData = await getDataForChart(deviceId);

  if (chartData) {
    res.json(chartData); // Kirimkan data ke klien
  } else {
    res.status(500).send("Error fetching chart data");
  }
});

app.get("/api/sensors/hours/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  console.log("get hours data:", deviceId);

  const chartData = await SensorHour.find({
    deviceId: deviceId,
  });

  if (chartData) {
    res.json(chartData); // Kirimkan data ke klien
  } else {
    res.status(500).send("Error fetching chart data");
  }
});

app.get("/api/sensors/fiveteen/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  console.log("get hours data:", deviceId);

  const chartData = await Sensor15Minutes.find({
    deviceId: deviceId,
  }).sort({ date: 1 });

  if (chartData) {
    res.json(chartData); // Kirimkan data ke klien
  } else {
    res.status(500).send("Error fetching chart data");
  }
});

// Rute utama untuk menampilkan halaman dengan Chart.js
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Menjalankan server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
