const mqtt = require('mqtt');
require('dotenv').config();

const MQTT_URL = process.env.MQTT_URL;
const MQTT_USER = process.env.MQTT_USER;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
const DEVICE_TOKEN = '16364003-4d58-41e3-9fb7-4b9d8897129f';

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

        // Once it hits threshold, stay there for a bit then jump to zero
        if (weight > 12) {
            console.log('--- Reseting weight to 0 (moving sack) ---');
            weight = 0;
        }

        console.log(`Publishing: ${weight.toFixed(1)}kg to ${topic}`);
        client.publish(topic, weight.toString());
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
