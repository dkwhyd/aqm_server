const WebSocket = require("ws");
const mongoose = require("mongoose");

// Konfigurasi MongoDB Atlas
const url_ma =
  "mongodb://aqm:aqm123@ac-ic7ust3-shard-00-00.rb7mi9g.mongodb.net:27017/aqm?replicaSet=atlas-munim4-shard-0&ssl=true&authSource=admin";

// Koneksi MongoDB menggunakan Mongoose
mongoose
  .connect(url_ma)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));

// Definisi schema dan model untuk data sensor
const sensorSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  pm2: { type: String },
  co2: { type: String },
  so2: { type: String },
  temperatur: { type: String },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  date: { type: Date, default: Date.now },
});
const sensor15Minute = mongoose.model("Sensor15Min", sensorSchema);
const SensorHour = mongoose.model("SensorHour", sensorSchema);
const SensorRealTime = mongoose.model("SensorRealTime", sensorSchema);

async function deleteRealTimeDataOneHourAgo() {
  const now = new Date();
  const oneHourAgo = new Date(now);
  oneHourAgo.setHours(now.getHours() - 1); // Menentukan waktu 1 jam yang lalu

  try {
    // Hapus data sensor real-time yang lebih dari 1 jam lalu
    await SensorRealTime.deleteMany({
      date: { $lte: oneHourAgo },
    });
    console.log("Old sensor data removed from SensorRealTime");
  } catch (err) {
    console.error("Error removing old sensor data:", err);
  }
}

deleteRealTimeDataOneHourAgo();
