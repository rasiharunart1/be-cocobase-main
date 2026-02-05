"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Icon from "@mdi/react";
import { mdiFilePdfBox, mdiFilterVariant } from "@mdi/js";

export default function ReportsPage() {
    const [devices, setDevices] = useState<any[]>([]);
    const [petanis, setPetanis] = useState<any[]>([]);
    const [loadingPetanis, setLoadingPetanis] = useState(false);
    const [filters, setFilters] = useState({
        deviceId: "",
        petaniId: "",
        type: "daily",
        start: "",
        end: "",
    });

    const fetchPetanis = async () => {
        try {
            setLoadingPetanis(true);
            const token = localStorage.getItem("token");

            if (!token) {
                console.error("No token found");
                toast.error("Sesi login tidak ditemukan. Silakan login kembali.");
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/petani?limit=100`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            console.log("Petani API Response:", data); // Debug log

            // Backend returns: { success: true, data: { pagination, petani } }
            if (data.success && data.data && data.data.petani) {
                setPetanis(data.data.petani);
            } else {
                console.error("Invalid response structure:", data);
                toast.error("Format data tidak sesuai");
            }
        } catch (error) {
            console.error("Failed to fetch petanis", error);
            toast.error("Gagal memuat data petani");
        } finally {
            setLoadingPetanis(false);
        }
    };

    const fetchDevices = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices`);
            const data = await res.json();
            if (data.success) {
                setDevices(data.data);
                if (data.data.length > 0) {
                    setFilters((prev) => ({ ...prev, deviceId: data.data[0].id.toString() }));
                }
            }
        } catch (error) {
            toast.error("Failed to fetch devices");
        }
    };


    useEffect(() => {
        fetchDevices();
        fetchPetanis();
    }, []);

    const handleDownload = () => {
        if (!filters.deviceId) {
            toast.error("Please select a device");
            return;
        }

        const query = new URLSearchParams(filters).toString();
        const url = `${process.env.NEXT_PUBLIC_API_URL}/reports/generate?${query}`;
        window.open(url, "_blank");
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Packing Reports</h1>

            <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#E37D2E] max-w-2xl">
                <div className="flex items-center gap-2 mb-4 text-[#E37D2E]">
                    <Icon path={mdiFilterVariant} size={1} />
                    <h2 className="text-lg font-semibold text-gray-800">Generate PDF Report</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Device</label>
                        <select
                            value={filters.deviceId}
                            onChange={(e) => setFilters({ ...filters, deviceId: e.target.value })}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                        >
                            <option value="">Choose Device...</option>
                            {devices.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Farmer (Optional)</label>
                        <select
                            value={filters.petaniId}
                            onChange={(e) => setFilters({ ...filters, petaniId: e.target.value })}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            disabled={loadingPetanis}
                        >
                            <option value="">
                                {loadingPetanis ? "Loading farmers..." : "All Farmers"}
                            </option>
                            {petanis.map((p) => (
                                <option key={p.id} value={p.id}>{p.nama}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                        >
                            <option value="daily">Daily Report (Today)</option>
                            <option value="weekly">Weekly Report (This Week)</option>
                            <option value="monthly">Monthly Report (This Month)</option>
                            <option value="custom">Custom Date Range</option>
                        </select>
                    </div>

                    {filters.type === "custom" && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={filters.start}
                                    onChange={(e) => setFilters({ ...filters, start: e.target.value })}
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={filters.end}
                                    onChange={(e) => setFilters({ ...filters, end: e.target.value })}
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={handleDownload}
                    className="mt-6 w-full bg-[#E37D2E] text-white py-3 rounded-md font-bold flex items-center justify-center gap-2 hover:bg-[#c47438] transition"
                >
                    <Icon path={mdiFilePdfBox} size={1} />
                    GENERATE & DOWNLOAD PDF
                </button>
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-4">
                <div className="text-blue-500 mt-1">
                    <Icon path={mdiFilePdfBox} size={1.5} />
                </div>
                <div>
                    <h3 className="font-semibold text-blue-800">About Reports</h3>
                    <p className="text-sm text-blue-600 mt-1">
                        Laporan PDF akan berisi daftar semua aktivitas packing berdasarkan alat yang dipilih. Laporan ini mencakup data waktu, berat bersih, dan status keberhasilan packing. Pastikan alat sudah terhubung dan mengirim data sebelum mencetak laporan.
                    </p>
                </div>
            </div>
        </div>
    );
}
