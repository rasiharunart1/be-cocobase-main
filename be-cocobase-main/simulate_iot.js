const axios = require('axios');

// CONFIGURATION
const API_URL = 'http://localhost:5000/api/v1/iot/loadcell/ingest';
const DEVICE_TOKEN = '7400e85c-80ef-4352-8400-6361294d3050'; // Device: solvia1
const INTERVAL_MS = 2000; // Send data every 2 seconds
const THRESHOLD = 10.0; // Target weight

let currentWeight = 0;
let isPacking = true;

console.log(`Starting simulation for device token: ${DEVICE_TOKEN}`);
console.log(`Target Threshold: ${THRESHOLD} kg`);

setInterval(async () => {
    try {
        // Simulate weight change
        if (isPacking) {
            // Add random weight between 0.5 and 2.0 kg
            const increment = parseFloat((Math.random() * 1.5 + 0.5).toFixed(2));
            currentWeight += increment;

            if (currentWeight >= THRESHOLD) {
                console.log(`\n>>> THRESHOLD REACHED! Sending final weight: ${currentWeight.toFixed(2)} kg`);
                isPacking = false; // Stop packing, reset next
            }
        } else {
            // Simulate removing the bag (reset to ~0)
            console.log(`\n<<< Resetting scale...`);
            currentWeight = parseFloat((Math.random() * 0.2).toFixed(2));
            isPacking = true; // Start new packing
        }

        // Send data
        console.log(`Sending weight: ${currentWeight.toFixed(2)} kg...`);
        const response = await axios.post(API_URL, {
            token: DEVICE_TOKEN,
            weight: parseFloat(currentWeight.toFixed(2))
        });

        if (response.data.alert) {
            console.log(`[SERVER RESPONSE] PACKING LOG SAVED! 🎉`);
        } else {
            console.log(`[SERVER RESPONSE] Reading saved.`);
        }

    } catch (error) {
        console.error(`Error sending data:`, error.message);
        if (error.response) {
            console.error(`Server responded with:`, error.response.data);
        }
    }
}, INTERVAL_MS);
