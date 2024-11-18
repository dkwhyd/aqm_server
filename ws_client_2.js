const WebSocket = require('ws');

// Membuat koneksi WebSocket ke server
let ws = new WebSocket('ws://localhost:9000');

ws.on('open', () => {
  console.log('Connected to server');

  // Kirim data deviceId dan lokasi saat pertama kali terhubung
  const registerMessage = {
    type: 'register',
    deviceId: 'device321',
    longitude: 51.52,
    latitude: 11.405,
  };
  ws.send(JSON.stringify(registerMessage));

  // Kirim data sensor secara periodik tanpa deviceId
  setInterval(() => {
    const sensorDataMessage = {
      type: 'sensorData',
      sensorData: {
        pm2: (Math.random() * (50 - 5) + 5).toFixed(2), // pm2 antara 5 dan 50
        co2: (Math.random() * (500 - 300) + 300).toFixed(2), // co2 antara 300 dan 500
        so2: (Math.random() * (10 - 1) + 1).toFixed(2), // so2 antara 1 dan 10
        temperatur: (Math.random() * (40 - 20) + 20).toFixed(1), // temperatur antara 20 dan 40
      },
    };
    ws.send(JSON.stringify(sensorDataMessage));
  }, 5000); // Interval 5 detik
});

ws.on('message', (message) => {
  const msgParse = JSON.parse(message)
  console.log('Message from server:', msgParse);
});

ws.on('close', () => {
  console.log('Disconnected from server');
  setTimeout(() => {
    console.log('reconnect ws')
    ws = new WebSocket('ws://localhost:9000');
    
  }, 3000);
});
