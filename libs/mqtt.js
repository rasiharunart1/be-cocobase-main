const mqtt = require('mqtt');
const prisma = require('./prisma');

const MQTT_URL = process.env.MQTT_URL;
const MQTT_USER = process.env.MQTT_USER;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

let client = null;

const initMQTT = () => {
    if (!MQTT_URL) {
        console.warn('MQTT_URL not set, skipping MQTT initialization');
        return;
    }

    console.log('Connecting to MQTT Broker...');
    client = mqtt.connect(MQTT_URL, {
        username: MQTT_USER,
        password: MQTT_PASSWORD,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
    });

    client.on('connect', () => {
        console.log('Connected to MQTT Broker');
        // Subscribe to multi-device weight topic using wildcard
        client.subscribe('cocobase/loadcell/+/weight', (err) => {
            if (!err) console.log('Subscribed to all device weight topics');
        });
    });

    client.on('message', async (topic, payload) => {
        const parts = topic.split('/');
        if (parts.length === 4 && parts[1] === 'loadcell' && parts[3] === 'weight') {
            const token = parts[2];
            const weight = parseFloat(payload.toString());
            await handleDeviceData(token, weight);
        }
    });

    client.on('error', (err) => {
        console.error('MQTT Connection Error:', err);
    });
};

const handleDeviceData = async (token, weight) => {
    try {
        if (isNaN(weight)) return;

        // Find device by token
        const device = await prisma.device.findUnique({
            where: { token }
        });

        if (!device) {
            console.warn(`Received data for unknown device token: ${token}`);
            return;
        }

        // Save reading anyway for real-time monitoring
        await prisma.loadcellReading.create({
            data: {
                weight,
                deviceId: device.id
            }
        });

        const RESET_THRESHOLD = 0.5; // Weight must be below this to reset isReady

        // Logic for resetting isReady
        if (weight <= RESET_THRESHOLD && !device.isReady) {
            console.log(`Device ${device.name} is now READY for next packing.`);
            await prisma.device.update({
                where: { id: device.id },
                data: { isReady: true }
            });
            return;
        }

        // Logic for triggering Packing Log
        if (weight >= device.threshold && device.isReady) {
            console.log(`[PACKING SUCCESS] Device ${device.name} reached threshold: ${weight}kg`);

            // Use transaction to ensure both log creation and state update success
            await prisma.$transaction([
                prisma.packingLog.create({
                    data: {
                        weight,
                        deviceId: device.id
                    }
                }),
                prisma.device.update({
                    where: { id: device.id },
                    data: { isReady: false }
                })
            ]);

            // Publish alert
            client.publish(`cocobase/loadcell/${token}/alerts`, JSON.stringify({
                event: 'THRESHOLD_REACHED',
                weight: weight,
                threshold: device.threshold,
                deviceName: device.name,
                timestamp: new Date().toISOString()
            }));
        }
    } catch (error) {
        console.error('Error in handleDeviceData:', error);
    }
};

module.exports = { initMQTT };
