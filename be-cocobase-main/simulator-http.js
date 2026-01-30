const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// CONFIGURATION
const API_URL = 'http://localhost:5000/api/v1/iot/loadcell/ingest'; // Change to Vercel URL for production test
const DEVICE_TOKEN = '7400e85c-80ef-4352-8400-6361294d3050';
const SLEEP_MS = 500;

console.log('--- COCOBASE HTTP IoT SIMULATOR ---');
console.log(`Target: ${API_URL}`);
console.log(`Device: ${DEVICE_TOKEN}`);

let weight = 0;
let step = 1.5;

async function sendData() {
    try {
        weight += step;

        // Simulate reaching threshold and resetting
        if (weight > 12) {
            console.log('--- PACKING SUCCESS! Reseting weight (moving sack) ---');
            weight = 0;
        }

        console.log(`Ingesting Weight: ${weight.toFixed(1)}kg...`);

        const response = await axios.post(API_URL, {
            token: DEVICE_TOKEN,
            weight: weight
        });

        if (response.data.alert) {
            console.log('\x1b[32m%s\x1b[0m', `[SERVER ALERT]: ${response.data.message}`);
        } else {
            console.log(`[SERVER]: ${response.data.message}`);
        }

    } catch (error) {
        if (error.response) {
            // Server responded with an error (404, 500, etc)
            console.error(`Ingestion Error [${error.response.status}]:`, error.response.data);
        } else if (error.request) {
            // Request was made but no response received (DNS, Connection Refused)
            console.error('Ingestion Error: No response from server. Check your API_URL and ensure it uses https://');
        } else {
            console.error('Ingestion Error:', error.message);
        }
    }
}

console.log('Starting simulation. Press Ctrl+C to stop.');
setInterval(sendData, SLEEP_MS);
