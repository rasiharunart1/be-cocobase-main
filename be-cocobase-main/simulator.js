const mqtt = require('mqtt');
require('dotenv').config();

const MQTT_URL = process.env.MQTT_URL;
const MQTT_USER = process.env.MQTT_USER;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
const DEVICE_TOKEN = '7400e85c-80ef-4352-8400-6361294d3050';

if (!MQTT_URL) {
    console.error('MQTT_URL not found in .env');
    process.exit(1);
}

console.log('Connecting to HiveMQ for simulation...');
const client = mqtt.connect(MQTT_URL, {
    username: MQTT_USER,
    password: MQTT_PASSWORD,
});

client.on('connect', () => {
    console.log('Simulator Connected!');
    console.log(`Device Token: ${DEVICE_TOKEN}`);

    let weight = 0;
    const topic = `cocobase/loadcell/${DEVICE_TOKEN}/weight`;
    const alertTopic = `cocobase/loadcell/${DEVICE_TOKEN}/alerts`;

    // Subscribe to alerts to see if the server processes them
    client.subscribe(alertTopic);

    // Simulate weight increase
    const interval = setInterval(() => {
        weight += 1.5; // Simulate sugar filling

        // Always publish weight for real-time monitoring
        client.publish(`cocobase/loadcell/${DEVICE_TOKEN}/weight`, weight.toString());
        console.log(`Published weight: ${weight.toFixed(2)} kg`);

        // Simulate "Push Button" event when weight reaches target
        if (weight >= 10.0) {
            console.log(">> SIMULATING BUTTON PRESS (PACKING EVENT) <<");
            client.publish(`cocobase/loadcell/${DEVICE_TOKEN}/pack`, weight.toString());

            // Reset simulation loop
            weight = 0.0;
            console.log("Weight reset to 0.0 kg");
        }
    }, 2000);

    client.on('message', (topic, payload) => {
        if (topic === alertTopic) {
            console.log('\x1b[31m%s\x1b[0m', `[SERVER ALERT RECEIVED]: ${payload.toString()}`);
        }
    });

    console.log('Running simulation... Press Ctrl+C to stop.');
});

client.on('error', (err) => {
    console.error('MQTT Error:', err);
});
