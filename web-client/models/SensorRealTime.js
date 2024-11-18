const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema({
  pm2: { type: String, required: true },
  co2: { type: String, required: true },
  so2: { type: String, required: true },
  temperatur: { type: String, required: true },
  location: { type: [Number], required: true }, // [latitude, longitude]
  date: { type: Date, default: Date.now },
});
sensorSchema.index({ date: 1 });
const SensorRealTime = mongoose.model("SensorRealTime", sensorSchema);

module.exports = SensorRealTime;
