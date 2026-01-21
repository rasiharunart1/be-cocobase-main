"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Icon from "@mdi/react";
import { mdiPlus, mdiPencil, mdiDelete, mdiKey, mdiContentCopy } from "@mdi/js";

export default function DeviceManagement() {
    const [devices, setDevices] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDevice, setCurrentDevice] = useState<any>(null);
    const [formData, setFormData] = useState({ name: "", threshold: 10 });

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices`);
            const data = await res.json();
            if (data.success) {
                setDevices(data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch devices");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = currentDevice
            ? `${process.env.NEXT_PUBLIC_API_URL}/devices/${currentDevice.id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/devices`;
        const method = currentDevice ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Device ${currentDevice ? "updated" : "created"} successfully`);
                setIsModalOpen(false);
                setFormData({ name: "", threshold: 10 });
                setCurrentDevice(null);
                fetchDevices();
            }
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this device?")) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Device deleted");
                fetchDevices();
            }
        } catch (error) {
            toast.error("Failed to delete device");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.info("Token copied to clipboard!");
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Device Management</h1>
                <button
                    onClick={() => {
                        setCurrentDevice(null);
                        setFormData({ name: "", threshold: 10 });
                        setIsModalOpen(true);
                    }}
                    className="bg-[#00B69B] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#00947d] transition"
                >
                    <Icon path={mdiPlus} size={1} /> Add Device
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Auth Token</th>
                            <th className="px-6 py-4">Threshold (kg)</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {devices.map((device) => (
                            <tr key={device.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{device.name}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{device.token}</code>
                                        <button onClick={() => copyToClipboard(device.token)} className="text-gray-400 hover:text-[#00B69B]">
                                            <Icon path={mdiContentCopy} size={0.7} />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{device.threshold} kg</td>
                                <td className="px-6 py-4 flex gap-3">
                                    <button
                                        onClick={() => {
                                            setCurrentDevice(device);
                                            setFormData({ name: device.name, threshold: device.threshold });
                                            setIsModalOpen(true);
                                        }}
                                        className="text-blue-500 hover:underline"
                                    >
                                        <Icon path={mdiPencil} size={0.8} />
                                    </button>
                                    <button onClick={() => handleDelete(device.id)} className="text-red-500 hover:underline">
                                        <Icon path={mdiDelete} size={0.8} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{currentDevice ? "Edit" : "Add"} Device</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Device Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded-md px-3 py-2"
                                    placeholder="e.g. Packing Machine A"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Target Threshold (kg)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.1"
                                    value={formData.threshold}
                                    onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) })}
                                    className="w-full border rounded-md px-3 py-2"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="bg-[#00B69B] text-white px-6 py-2 rounded-md font-medium">
                                    {currentDevice ? "Save Changes" : "Create Device"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
