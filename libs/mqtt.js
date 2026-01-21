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
        // Subscribe to weight and pack topics
        client.subscribe(['cocobase/loadcell/+/weight', 'cocobase/loadcell/+/pack'], (err) => {
            if (!err) console.log('Subscribed to device topics');
        });
    });

    client.on('message', async (topic, payload) => {
        const parts = topic.split('/');
        if (parts.length === 4 && parts[1] === 'loadcell') {
            const token = parts[2];
            const type = parts[3];
            const value = parseFloat(payload.toString());

            if (type === 'weight') {
                await handleDeviceData(token, value);
            } else if (type === 'pack') {
                await handlePackingEvent(token, value);
            }
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

        // Publish to real-time UI topic
        publishRealtimeWeight(token, weight);

    } catch (error) {
        console.error('Error in handleDeviceData:', error);
    }
};

const handlePackingEvent = async (token, weight) => {
    try {
        const device = await prisma.device.findUnique({ where: { token } });
        if (!device) return;

        console.log(`[PACKING EVENT] Manual trigger for ${device.name} at ${weight}kg`);

        await prisma.packingLog.create({
            data: {
                weight: weight || 0, // Fallback if weight is not sent in payload, though simulator should send it
                deviceId: device.id
            }
        });

        // Trigger dashboard update
        publishDashboardUpdate();

        // Publish alert (optional, but good for UI feedback)
        client.publish(`cocobase/loadcell/${token}/alerts`, JSON.stringify({
            event: 'PACKING_COMPLETED',
            weight: weight,
            deviceName: device.name,
            type: 'MANUAL_BUTTON',
            timestamp: new Date().toISOString()
        }));

    } catch (error) {
        console.error('Error in handlePackingEvent:', error);
    }
};

const publishWeight = (token, weight) => {
    if (client && client.connected) {
        client.publish(`cocobase/loadcell/${token}/weight`, weight.toString());
    }
};

const publishRealtimeWeight = (token, weight) => {
    if (client && client.connected) {
        // Broadcast to a dedicated topic for the UI to consume
        client.publish(`cocobase/loadcell/${token}/realtime`, weight.toString());
    }
};

const publishDashboardUpdate = () => {
    if (client && client.connected) {
        client.publish('cocobase/dashboard/update', JSON.stringify({ event: 'PACKING_LOG_CREATED', timestamp: new Date() }));
    }
};

module.exports = { initMQTT, publishWeight, publishRealtimeWeight, publishDashboardUpdate };
