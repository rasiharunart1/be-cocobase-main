const axios = require('axios');

// CONFIGURATION
const API_URL = 'https://be-cocobase-main.vercel.app/api/v1/iot/loadcell/ingest'; // Production
// const DEVICE_TOKEN = '7400e85c-80ef-4352-8400-6361294d3050'; // Use the token from previous files
const DEVICE_TOKEN = '7400e85c-80ef-4352-8400-6361294d3050';

async function runTest() {
    console.log(`--- THRESHOLD VERIFICATION TEST ---`);
    console.log(`Target: ${API_URL}`);
    console.log(`Device: ${DEVICE_TOKEN}`);

    try {
        // 1. Initial Reading to get Thresholds
        console.log(`\n1. Sending initial weight (0.0 kg)...`);
        let response = await axios.post(API_URL, { token: DEVICE_TOKEN, weight: 0.0 });

        const mainThreshold = response.data.threshold;
        const relayThreshold = response.data.relayThreshold;

        console.log(`> Received configuration:`);
        console.log(`  - Main Threshold (Auto Publish): ${mainThreshold} kg`);
        console.log(`  - Relay Threshold (Start/Stop): ${relayThreshold} kg`);

        // 2. Simulate Below Relay Threshold
        let weight = relayThreshold - 1.0;
        console.log(`\n2. Sending weight BELOW Relay Threshold (${weight} kg)...`);
        response = await axios.post(API_URL, { token: DEVICE_TOKEN, weight: weight });
        console.log(`  - Server Message: ${response.data.message}`);
        console.log(`  - EXPECTATION: Relay should be ON (Filling)`);

        // 3. Simulate Above Relay Threshold but Below Main
        weight = relayThreshold + 0.1;
        // Ensure it's below main if main > relay
        if (weight >= mainThreshold) weight = mainThreshold - 0.1;

        console.log(`\n3. Sending weight ABOVE Relay Threshold (${weight} kg)...`);
        response = await axios.post(API_URL, { token: DEVICE_TOKEN, weight: weight });
        console.log(`  - Server Message: ${response.data.message}`);
        console.log(`  - EXPECTATION: Relay should be OFF (Stop Filling)`);

        // 4. Simulate Above Main Threshold
        weight = mainThreshold + 0.5;
        console.log(`\n4. Sending weight ABOVE Main Threshold (${weight} kg)...`);
        response = await axios.post(API_URL, { token: DEVICE_TOKEN, weight: weight });
        console.log(`  - Server Message: ${response.data.message}`);
        if (response.data.alert) {
            console.log(`  - ALERT: ${response.data.message}`);
            console.log(`  - EXPECTATION: Auto Publish / Packing Event Triggered`);
        } else {
            console.log(`  - EXPECTATION: Auto Publish Triggered (Check logs/DB)`);
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
}

runTest();
