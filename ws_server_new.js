const WebSocket = require("ws");
const mongoose = require("mongoose");

// Konfigurasi MongoDB Atlas


const url_ma = "";

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
const Sensor15Minutes = mongoose.model("Sensor15Minutes", sensorSchema);
const SensorHour = mongoose.model("SensorHour", sensorSchema);
const SensorRealTime = mongoose.model("SensorRealTime", sensorSchema); // Model untuk menyimpan data sensor real-time

const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

const Devices = mongoose.model("Devices", deviceSchema);

// Menyimpan koneksi berdasarkan deviceId
const clients = new Map();
const sensorDataCache = new Map(); // Cache untuk menyimpan data sensor terbaru

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

// Membuat server WebSocket
const wss = new WebSocket.Server({ port: 9000 });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      console.log(data);

      if (data.type === "register") {
        // Register deviceId dan lokasi
        const { deviceId, longitude, latitude } = data;

        const devices = new Devices({
          deviceId: data.deviceId,
          location: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
        });

        const checkDevice = await Devices.find({
          deviceId: data.deviceId,
        });
        if (checkDevice.length === 0) {
          const registerDevice = await devices.save();
          console.log(registerDevice);
          if (registerDevice) {
            ws.send(
              JSON.stringify({
                register: "success",
                deviceId: data.deviceId,
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                register: "registered",
                deviceId: data.deviceId,
              })
            );
          }
        }
        clients.set(ws, { deviceId, longitude, latitude });
        console.log(
          `Device registered: ${deviceId}, Location: [${longitude}, ${latitude}]`
        );
      } else if (data.type === "sensorData") {
        // Data sensor dikirim tanpa deviceId
        const clientInfo = clients.get(ws);

        if (clientInfo) {
          //   console.log(
          //     `Sensor data from device ${clientInfo.deviceId}:`,
          //     data.sensorData
          //   );

          // Simpan data sensor ke koleksi SensorRealTime
          const sensorRealTimeData = new SensorRealTime({
            deviceId: clientInfo.deviceId,
            pm2: data.sensorData.pm2,
            co2: data.sensorData.co2,
            so2: data.sensorData.so2,
            temperatur: data.sensorData.temperatur,
            location: {
              latitude: clientInfo.latitude,
              longitude: clientInfo.longitude,
            },
          });

          await sensorRealTimeData.save();
          //   console.log(
          //     "Sensor data saved to SensorRealTime:",
          //     clientInfo.deviceId
          //   );
          ws.send(
            JSON.stringify({
              data: "saved",
              deviceId: data.deviceId,
            })
          );
          // Simpan data sensor terbaru di cache untuk device tertentu
          sensorDataCache.set(clientInfo.deviceId, {
            pm2: data.sensorData.pm2,
            co2: data.sensorData.co2,
            so2: data.sensorData.so2,
            temperatur: data.sensorData.temperatur,
            location: {
              latitude: clientInfo.latitude,
              longitude: clientInfo.longitude,
            },
            date: new Date(), // Menyimpan waktu terkini
          });

          //   console.log("Sensor data cached:", clientInfo.deviceId);
        } else {
          console.error("Unknown client attempted to send sensor data");
        }
      }
    } catch (err) {
      console.error("Invalid message format:", message, "Error:", err);
    }
  });

  ws.on("close", () => {
    // Hapus koneksi saat client terputus
    clients.delete(ws);
    console.log("Client disconnected");
  });
});

console.log("WebSocket server running on ws://localhost:9000");

// Fungsi untuk menyimpan data ke MongoDB setiap menit 00
setInterval(async () => {
  const now = new Date();
  const minutes = now.getMinutes();

  // Cek apakah menit = 00
  if (minutes === 0) {
    console.log(`Saving data for hour: ${now.getHours()}:00`);

    // Iterasi semua device yang ada di cache
    for (const [deviceId, sensorData] of sensorDataCache.entries()) {
      // Simpan data sensor terbaru ke koleksi sensorHour
      const sensorHour = new SensorHour({
        deviceId: deviceId,
        pm2: sensorData.pm2,
        co2: sensorData.co2,
        so2: sensorData.so2,
        temperatur: sensorData.temperatur,
        location: sensorData.location,
        date: sensorData.date, // Waktu saat data disimpan
      });

      await sensorHour.save();
      console.log(`Sensor data saved to sensorHour for device ${deviceId}`);

      // Hapus data dari cache setelah disimpan ke sensorHour
      sensorDataCache.delete(deviceId);
    }
    await deleteRealTimeDataOneHourAgo();
  }
}, 60000); // Periksa setiap menit

// simpan data per 15 menit
setInterval(async () => {
  const now = new Date();
  const minutes = now.getMinutes();

  // Cek apakah menit = 00
  console.log(`Saving sensor data for 15 minute`);

  // Iterasi semua device yang ada di cache
  for (const [deviceId, sensorData] of sensorDataCache.entries()) {
    // Simpan data sensor terbaru ke koleksi sensorHour
    const sensor15Minute = new Sensor15Minutes({
      deviceId: deviceId,
      pm2: sensorData.pm2,
      co2: sensorData.co2,
      so2: sensorData.so2,
      temperatur: sensorData.temperatur,
      location: sensorData.location,
      date: sensorData.date, // Waktu saat data disimpan
    });

    await sensor15Minute.save();
    console.log(`Sensor data saved to sensor15Minute for device ${deviceId}`);
  }
}, 900000);
