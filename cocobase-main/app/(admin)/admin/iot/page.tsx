"use client";

import { useState, useEffect } from "react";
import { getData } from "@/app/utils/fetchData";
import { toast } from "react-toastify";
import Icon from "@mdi/react";
import { mdiDevices, mdiWeightKilogram, mdiCog, mdiHistory, mdiTrashCan, mdiRefresh, mdiCounter, mdiScaleBalance } from "@mdi/js";

export default function IoTDashboard() {
    const [weight, setWeight] = useState<number>(0);
    const [threshold, setThreshold] = useState<number>(10);
    const [logs, setLogs] = useState<any[]>([]);
    const [devices, setDevices] = useState<any[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [petanis, setPetanis] = useState<any[]>([]);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [selectedPetaniId, setSelectedPetaniId] = useState<string>("");

    useEffect(() => {
        fetchDevices();
        fetchPetanis();
    }, []);

    useEffect(() => {
        if (!selectedDevice) return;

        setWeight(0);
        setThreshold(selectedDevice.threshold);
        fetchLogs(selectedDevice.id);
        fetchActiveSession(selectedDevice.id);

        // Poll for latest weight reading every 2 seconds
        const weightInterval = setInterval(async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/iot/loadcell/latest/${selectedDevice.id}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setWeight(data.data.weight);

                    // Check if weight exceeds threshold and device is ready
                    if (data.data.weight >= selectedDevice.threshold) {
                        // Refresh logs to check for new packing events
                        fetchLogs(selectedDevice.id);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch weight", error);
            }
        }, 2000);

        return () => {
            clearInterval(weightInterval);
        };
    }, [selectedDevice]);

    const fetchPetanis = async () => {
        try {
            const data = await getData({ path: "/petani", limit: 100 });
            if (data && data.petani) {
                setPetanis(data.petani);
            }
        } catch (error) {
            console.error("Failed to fetch petanis");
        }
    };

    const fetchActiveSession = async (deviceId: number) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/session/active/${deviceId}`);
            const data = await res.json();
            if (data.success) {
                setActiveSession(data.data);
            } else {
                setActiveSession(null);
            }
        } catch (error) {
            setActiveSession(null);
        }
    };

    const handleStartSession = async () => {
        if (!selectedDevice || !selectedPetaniId) {
            toast.error("Please select a farmer first");
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/session/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    deviceId: selectedDevice.id,
                    petaniId: parseInt(selectedPetaniId)
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Session started");
                setActiveSession(data.data);
                setSelectedPetaniId("");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to start session");
        }
    };

    const handleEndSession = async () => {
        if (!selectedDevice) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/session/end/${selectedDevice.id}`, {
                method: "POST",
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Session ended");
                setActiveSession(null);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to end session");
        }
    };

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

    const handleDeleteLog = async (logId: number) => {
        if (!confirm("Are you sure you want to delete this log?")) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/iot/logs/${logId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Log deleted");
                fetchLogs(selectedDevice.id);
            } else {
                toast.error(data.message || "Failed to delete log");
            }
        } catch (error) {
            toast.error("Failed to delete log");
        }
    };

    const handleResetLogs = async () => {
        if (!selectedDevice) return;
        const confirmReset = prompt(`Type "RESET" to confirm deleting ALL logs for ${selectedDevice.name}?`);
        if (confirmReset !== "RESET") return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/iot/logs/reset/${selectedDevice.id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                toast.success("All logs reset successfully");
                fetchLogs(selectedDevice.id);
            } else {
                toast.error(data.message || "Failed to reset logs");
            }
        } catch (error) {
            toast.error("Failed to reset logs");
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

            {/* Session Management Panel */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
                            Session Management
                        </h2>
                        <p className="text-sm text-gray-500">Manage packing session and assign farmer</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 items-center">
                        {activeSession ? (
                            <div className="flex items-center gap-4 bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                                <div className="text-sm">
                                    <span className="text-gray-500 block text-xs uppercase font-bold">Current Farmer</span>
                                    <span className="text-green-700 font-bold text-lg">{activeSession.petani?.nama || "Unknown"}</span>
                                </div>
                                <div className="text-sm border-l border-green-200 pl-4">
                                    <span className="text-gray-500 block text-xs uppercase font-bold">Started At</span>
                                    <span className="text-gray-700 font-medium">
                                        {new Date(activeSession.startedAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                <button
                                    onClick={handleEndSession}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-md shadow-red-200 ml-2"
                                >
                                    STOP SESSION
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <select
                                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedPetaniId}
                                    onChange={(e) => setSelectedPetaniId(e.target.value)}
                                >
                                    <option value="">-- Select Farmer --</option>
                                    {petanis.map(p => (
                                        <option key={p.id} value={p.id}>{p.nama}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleStartSession}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition shadow-md shadow-blue-200 whitespace-nowrap"
                                >
                                    START SESSION
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Summary: Total Records */}
                <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center border-t-4 border-[#8B5CF6] relative overflow-hidden">
                    <div className="absolute top-4 left-4 text-gray-200">
                        <Icon path={mdiCounter} size={2} />
                    </div>
                    <span className="text-gray-500 uppercase text-xs font-bold mb-2 tracking-wider">Total Records</span>
                    <div className="text-5xl font-black text-[#202224]">
                        {logs.length}
                    </div>
                    <span className="text-sm text-gray-400 mt-2">Packing Logs</span>
                </div>

                {/* Summary: Total Weight */}
                <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center border-t-4 border-[#F59E0B] relative overflow-hidden">
                    <div className="absolute top-4 left-4 text-gray-200">
                        <Icon path={mdiScaleBalance} size={2} />
                    </div>
                    <span className="text-gray-500 uppercase text-xs font-bold mb-2 tracking-wider">Total Weight</span>
                    <div className="text-5xl font-black text-[#202224]">
                        {logs.reduce((sum, log) => sum + log.weight, 0).toFixed(1)}
                        <span className="text-xl text-gray-300 font-light"> kg</span>
                    </div>
                    <span className="text-sm text-gray-400 mt-2">Combined Output</span>
                </div>

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
                <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#E37D2E] md:col-span-3">
                    <div className="flex items-center gap-2 mb-6">
                        <Icon path={mdiCog} size={0.9} className="text-[#E37D2E]" />
                        <h2 className="text-lg font-bold text-gray-800">Device Settings</h2>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Target Weight (Threshold)</label>
                            <div className="flex gap-2 items-center">
                                <div className="relative flex-grow max-w-xs">
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
                                    className="bg-[#E37D2E] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#c47438] transition shadow-lg shadow-orange-100"
                                >
                                    SAVE SETTINGS
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
                    <div className="flex gap-2">
                        <button
                            onClick={handleResetLogs}
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                            <Icon path={mdiTrashCan} size={0.7} />
                            RESET ALL
                        </button>
                        <button
                            onClick={() => selectedDevice && fetchLogs(selectedDevice.id)}
                            className="text-[#00B69B] text-sm font-bold hover:text-[#00947d] flex items-center gap-1"
                        >
                            <Icon path={mdiRefresh} size={0.8} />
                            REFRESH
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white text-[10px] uppercase text-gray-400 font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Weight</th>
                                <th className="px-6 py-4">Farmer</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium bg-gray-50/20">
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
                                        <td className="px-6 py-4 text-gray-700 font-medium">
                                            {log.petani ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                        {log.petani.nama.charAt(0)}
                                                    </span>
                                                    {log.petani.nama}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">No Farmer</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full font-bold border border-green-100 uppercase tracking-tighter">Success</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDeleteLog(log.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                                title="Delete Log"
                                            >
                                                <Icon path={mdiTrashCan} size={0.8} />
                                            </button>
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
