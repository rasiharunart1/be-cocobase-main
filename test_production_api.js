const axios = require('axios');

const API_URL = 'https://be-cocobase-main.vercel.app/api/v1/iot/loadcell/ingest';
const DEVICE_TOKEN = '7400e85c-80ef-4352-8400-6361294d3050';

async function testThreshold() {
    try {
        console.log(`Testing API: ${API_URL}`);
        console.log(`With Token: ${DEVICE_TOKEN}`);

        const response = await axios.post(API_URL, {
            token: DEVICE_TOKEN,
            weight: 0.1
        });

        console.log('\n--- SERVER RESPONSE ---');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.threshold !== undefined) {
            console.log('\n✅ SUCCESS: Threshold field found!');
        } else {
            console.log('\n❌ FAILED: Threshold field MISSING!');
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.log('Server Error Data:', error.response.data);
        }
    }
}

testThreshold();
