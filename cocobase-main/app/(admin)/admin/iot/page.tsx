"use client";

import { useState, useEffect } from "react";
import mqtt from "mqtt";
import { toast } from "react-toastify";
import Icon from "@mdi/react";
import { mdiDevices, mdiWeightKilogram, mdiCog, mdiHistory } from "@mdi/js";

export default function IoTDashboard() {
    const [weight, setWeight] = useState<number>(0);
    const [threshold, setThreshold] = useState<number>(10);
    const [logs, setLogs] = useState<any[]>([]);
    const [devices, setDevices] = useState<any[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const MQTT_WS_URL = process.env.NEXT_PUBLIC_MQTT_URL || "wss://broker.hivemq.com:8884/mqtt";

    useEffect(() => {
        fetchDevices();
    }, []);

    useEffect(() => {
        if (!selectedDevice) return;

        setWeight(0);
        setThreshold(selectedDevice.threshold);
        fetchLogs(selectedDevice.id);

        const client = mqtt.connect(MQTT_WS_URL, {
            clean: true,
            connectTimeout: 4000,
        });

        const TOPIC_WEIGHT = `cocobase/loadcell/${selectedDevice.token}/weight`;
        const TOPIC_ALERTS = `cocobase/loadcell/${selectedDevice.token}/alerts`;

        client.on("connect", () => {
            console.log(`Connected to MQTT for device: ${selectedDevice.name}`);
            client.subscribe([TOPIC_WEIGHT, TOPIC_ALERTS]);
        });

        client.on("message", (topic, payload) => {
            const message = payload.toString();
            if (topic === TOPIC_WEIGHT) {
                setWeight(parseFloat(message));
            } else if (topic === TOPIC_ALERTS) {
                const alert = JSON.parse(message);
                toast.warning(`Bag packed on ${selectedDevice.name}! Weight: ${alert.weight}kg`);
                fetchLogs(selectedDevice.id);
            }
        });

        return () => {
            client.end();
        };
    }, [selectedDevice]);

    const fetchDevices = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices`);
            const data = await res.json();
            if (data.success && data.data.length > 0) {
                setDevices(data.data);
                setSelectedDevice(data.data[0]);
            } else {
                setLoading(false);
            }
        } catch (error) {
            toast.error("Failed to fetch devices");
            setLoading(false);
        }
    };

    const fetchLogs = async (deviceId: number) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/iot/loadcell/logs/${deviceId}`);
            const data = await res.json();
            if (data.success) {
                setLogs(data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch logs", error);
            setLoading(false);
        }
    };

    const updateThreshold = async (newThreshold: number) => {
        if (!selectedDevice) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${selectedDevice.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ threshold: newThreshold }),
            });
            const data = await res.json();
            if (data.success) {
                setThreshold(data.data.threshold);
                toast.success("Threshold updated!");
            }
        } catch (error) {
            toast.error("Update failed");
        }
    };

    if (devices.length === 0 && !loading) {
        return (
            <div className="p-6 text-center">
                <Icon path={mdiDevices} size={3} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-600">No Devices Found</h2>
                <p className="text-gray-500">Please add a device in "Management Alat" first.</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">IoT Monitoring</h1>
                    <p className="text-sm text-gray-500">Real-time data from your packing machines</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border">
                    <Icon path={mdiDevices} size={0.8} className="text-gray-400" />
                    <select
                        value={selectedDevice?.id}
                        onChange={(e) => setSelectedDevice(devices.find(d => d.id === parseInt(e.target.value)))}
                        className="bg-transparent text-sm font-medium focus:outline-none"
                    >
                        {devices.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Real-time Weight Display */}
                <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center border-t-4 border-[#00B69B] relative overflow-hidden">
                    <div className="absolute top-4 left-4 text-gray-300">
                        <Icon path={mdiWeightKilogram} size={2} />
                    </div>
                    <span className="text-gray-500 uppercase text-xs font-bold mb-2 tracking-wider">Current Weight</span>
                    <div className="text-7xl font-black text-[#202224] transition-all duration-300">
                        {weight.toFixed(2)} <span className="text-2xl text-gray-300 font-light">kg</span>
                    </div>
                    <div className="mt-6 flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                        <div className={`h-3 w-3 rounded-full ${weight >= threshold ? 'bg-red-500 animate-pulse' : 'bg-[#00B69B]'}`}></div>
                        <span className="text-sm font-semibold text-gray-600">
                            {weight >= threshold ? 'PACKING COMPLETED' : 'MONITORING...'}
                        </span>
                    </div>
                </div>

                {/* Device Settings */}
                <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#E37D2E]">
                    <div className="flex items-center gap-2 mb-6">
                        <Icon path={mdiCog} size={0.9} className="text-[#E37D2E]" />
                        <h2 className="text-lg font-bold text-gray-800">Device Settings</h2>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Target Weight (Threshold)</label>
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={threshold}
                                        onChange={(e) => setThreshold(parseFloat(e.target.value))}
                                        className="w-full border-2 border-gray-100 rounded-lg px-4 py-3 focus:border-[#E37D2E] transition-colors outline-none font-bold text-lg"
                                    />
                                    <span className="absolute right-4 top-3.5 text-gray-400 font-bold">KG</span>
                                </div>
                                <button
                                    onClick={() => updateThreshold(threshold)}
                                    className="bg-[#E37D2E] text-white px-6 rounded-lg font-bold hover:bg-[#c47438] transition shadow-lg shadow-orange-100"
                                >
                                    SAVE
                                </button>
                            </div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                            <p className="text-xs text-orange-700 leading-relaxed font-medium">
                                Sistem akan mencatat log packing dan mengirim notifikasi alert saat timbangan mencapai target di atas.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Packing Logs History */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <Icon path={mdiHistory} size={1} className="text-[#00B69B]" />
                        <h2 className="text-lg font-bold">Packing History</h2>
                    </div>
                    <button
                        onClick={() => selectedDevice && fetchLogs(selectedDevice.id)}
                        className="text-[#00B69B] text-sm font-bold hover:text-[#00947d] flex items-center gap-1"
                    >
                        REFRESH DATA
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white text-[10px] uppercase text-gray-400 font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Weight</th>
                                <th className="px-6 py-4">Machine Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400 font-medium bg-gray-50/20">
                                        {loading ? "Synchronizing logs..." : `No packing history found for ${selectedDevice?.name}`}
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 font-medium">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-800 tracking-tight">
                                            {log.weight.toFixed(2)} kg
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full font-bold border border-green-100 uppercase tracking-tighter">Success Packed</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
