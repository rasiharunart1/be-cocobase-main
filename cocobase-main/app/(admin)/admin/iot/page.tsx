"use client";

import { useState, useEffect } from "react";
import { getData } from "@/app/utils/fetchData";
import { toast } from "react-toastify";
import Icon from "@mdi/react";
import { mdiDevices, mdiWeightKilogram, mdiCog, mdiHistory, mdiTrashCan, mdiRefresh, mdiCounter, mdiScaleBalance, mdiCheckDecagram, mdiAccountPlus, mdiWrench } from "@mdi/js";

export default function IoTDashboard() {
    const [weight, setWeight] = useState<number>(0);
    const [threshold, setThreshold] = useState<number>(10);
    const [relayThreshold, setRelayThreshold] = useState<number>(10);
    const [logs, setLogs] = useState<any[]>([]);
    const [devices, setDevices] = useState<any[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [petanis, setPetanis] = useState<any[]>([]);

    // Calibration State
    const [isCalModalOpen, setIsCalModalOpen] = useState(false);
    const [calKnownWeight, setCalKnownWeight] = useState<number>(0);

    useEffect(() => {
        fetchDevices();
        fetchPetanis();
    }, []);

    useEffect(() => {
        if (!selectedDevice) return;

        setWeight(0);
        setThreshold(selectedDevice.threshold);
        setRelayThreshold(selectedDevice.relayThreshold);
        fetchLogs(selectedDevice.id);

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

    // Session management removed - logs are now auto-created and farmers assigned via dropdown

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

    const updateThresholds = async () => {
        if (!selectedDevice) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${selectedDevice.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    threshold: threshold,
                    relayThreshold: relayThreshold
                }),
            });
            const data = await res.json();
            if (data.success) {
                setThreshold(data.data.threshold);
                setRelayThreshold(data.data.relayThreshold);
                toast.success("Thresholds updated!");
            }
        } catch (error) {
            toast.error("Update failed");
        }
    };

    const handleVerifyLog = async (logId: number, petaniId: number) => {
        if (!petaniId) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/iot/logs/verify/${logId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ petaniId }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Log verified and assigned!");
                fetchLogs(selectedDevice.id);
            } else {
                toast.error(data.message || "Verification failed");
            }
        } catch (error) {
            toast.error("Network error during verification");
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

    const handleCalibrationCommand = async (type: "TARE" | "CALIBRATE", value?: number) => {
        if (!selectedDevice) return;

        try {
            const payload: any = { type };
            if (type === "CALIBRATE") {
                if (!value || value <= 0) {
                    toast.error("Please enter a valid weight");
                    return;
                }
                // Calculate new factor based on current reading
                // Formula: newFactor = (rawWeight / knownWeight) * currentFactor
                // BUT: Since we don't have rawWeight handy, we rely on the device to do the math?
                // Actually my firmware logic for "CALIBRATE" expects a VALUE = NEW FACTOR.
                // Uh oh, the firmware I wrote expects "value" to be the NEW FACTOR.
                // "float newFactor = cmd["value"];"

                // So the Frontend needs to calculate the new factor?
                // Or the Firmware should be smarter?
                // The README said: "Gunakan rumus: FaktorBaru = (BeratTerbaca / BeratAsli) * FaktorLama"
                // Ideally the frontend does this math.

                // Get current factor (we need to fetch it from device details?)
                // The device object has 'calibrationFactor' in DB? Yes I added it.
                // But selectedDevice might be stale.

                // Let's assume we do the math here if we have 'weight' (current reading)
                // NewFactor = (CurrentWeight / KnownWeight) * CurrentFactor

                // We need the CurrentFactor. selectedDevice.calibrationFactor might be old if updated elsewhere.
                // But let's use selectedDevice.calibrationFactor.

                const currentFactor = selectedDevice.calibrationFactor || 2280.0;
                const reading = weight; // Current weight from state

                if (reading === 0) {
                    toast.error("Cannot calibrate if reading is 0. Please place weight first.");
                    return;
                }

                const newFactor = (reading / value) * currentFactor;
                payload.value = newFactor;

                console.log(`Calibrating: Reading=${reading}, Known=${value}, OldFactor=${currentFactor} -> NewFactor=${newFactor}`);
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/iot/commands/${selectedDevice.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`Command ${type} sent! Wait 1-2s...`);
                if (type === "CALIBRATE") {
                    // Update local device state to reflect new factor
                    // Ideally re-fetch device
                    fetchDevices();
                    setIsCalModalOpen(false);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to send command");
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

            {/* Session Management Panel Removed - Auto-logging enabled */}

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
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Auto-Log Threshold</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={threshold}
                                        onChange={(e) => setThreshold(parseFloat(e.target.value))}
                                        className="w-full border-2 border-gray-100 rounded-lg px-4 py-3 focus:border-[#E37D2E] transition-colors outline-none font-bold text-lg"
                                    />
                                    <span className="absolute right-4 top-3.5 text-gray-400 font-bold">KG</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Log otomatis dibuat saat mencapai berat ini</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Relay Threshold (Max Weight)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={relayThreshold}
                                        onChange={(e) => setRelayThreshold(parseFloat(e.target.value))}
                                        className="w-full border-2 border-gray-100 rounded-lg px-4 py-3 focus:border-blue-500 transition-colors outline-none font-bold text-lg"
                                    />
                                    <span className="absolute right-4 top-3.5 text-gray-400 font-bold">KG</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">ESP32 mematikan relay saat mencapai berat ini</p>
                            </div>
                        </div>
                        <button
                            onClick={updateThresholds}
                            className="bg-[#E37D2E] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#c47438] transition shadow-lg shadow-orange-100"
                        >
                            SAVE THRESHOLDS
                        </button>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                💡 <strong>Auto-Log:</strong> Log dibuat otomatis saat mencapai threshold pertama. <strong>Relay:</strong> ESP32 mematikan relay saat mencapai threshold kedua untuk mencegah overfill.
                            </p>
                        </div>
                        {/* Calibration Button */}
                        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setIsCalModalOpen(true)}
                                className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold text-sm transition-colors border border-gray-200 px-4 py-2 rounded-lg hover:border-blue-300 bg-gray-50 hover:bg-blue-50"
                            >
                                <Icon path={mdiWrench} size={0.8} />
                                Calibration Mode
                            </button>
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
                                        <td className="px-6 py-4 flex items-center justify-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <select
                                                    onChange={(e) => handleVerifyLog(log.id, parseInt(e.target.value))}
                                                    className="text-[10px] border border-blue-200 rounded px-1 py-1 bg-blue-50 text-blue-700 outline-none font-bold uppercase transition-all hover:bg-blue-100"
                                                    value={log.petani?.id || ""}
                                                >
                                                    <option value="">{log.petani ? "Change Farmer..." : "Assign Farmer..."}</option>
                                                    {petanis.map(p => (
                                                        <option key={p.id} value={p.id}>{p.nama}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteLog(log.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                title="Delete Log"
                                            >
                                                <Icon path={mdiTrashCan} size={0.7} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Calibration Modal */}
            {isCalModalOpen && selectedDevice && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl transform transition-all">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                                    <Icon path={mdiWrench} className="text-[#00B69B]" size={1.2} />
                                    Calibration
                                </h2>
                                <p className="text-sm text-gray-400 font-medium">Remote control for {selectedDevice.name}</p>
                            </div>
                            <button onClick={() => setIsCalModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Live Reading</span>
                            <div className="text-5xl font-black text-[#202224] flex items-baseline gap-2">
                                {weight.toFixed(2)}
                                <span className="text-lg text-gray-400 font-bold">kg</span>
                            </div>
                            <span className="text-xs text-[#00B69B] bg-[#00B69B]/10 px-2 py-1 rounded-md mt-2 font-bold animate-pulse">
                                Live from Device
                            </span>
                        </div>

                        <div className="space-y-6">
                            {/* Step 1: Tare */}
                            <div className="flex items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors group">
                                <div>
                                    <h3 className="font-bold text-gray-700">1. Zero Scale (Tare)</h3>
                                    <p className="text-xs text-gray-400">Empty the scale before clicking</p>
                                </div>
                                <button
                                    onClick={() => handleCalibrationCommand("TARE")}
                                    className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-900 shadow-lg shadow-gray-200"
                                >
                                    TARE NOW
                                </button>
                            </div>

                            {/* Step 2: Calibrate */}
                            <div className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors">
                                <h3 className="font-bold text-gray-700 mb-2">2. Calibrate Factor</h3>
                                <p className="text-xs text-gray-400 mb-4">Place a known weight (e.g., 1kg) and enter value below.</p>

                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <input
                                            type="number"
                                            placeholder="Known Weight..."
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#00B69B] outline-none font-bold"
                                            onChange={(e) => setCalKnownWeight(parseFloat(e.target.value))}
                                        />
                                        <span className="absolute right-4 top-2.5 text-gray-400 text-xs font-bold">KG</span>
                                    </div>
                                    <button
                                        onClick={() => handleCalibrationCommand("CALIBRATE", calKnownWeight)}
                                        className="bg-[#00B69B] text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#00947d] shadow-lg shadow-teal-100"
                                    >
                                        CALIBRATE
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-[10px] text-gray-400 bg-yellow-50 p-2 rounded border border-yellow-100">
                                ⚠️ Commands may take 1-2 seconds to process due to polling interval.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
