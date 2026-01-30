"use client";

import { useState, useEffect } from "react";
import Icon from "@mdi/react";
import { mdiPodium, mdiMedal, mdiStar } from "@mdi/js";

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/statistics/leaderboard`);
            const data = await res.json();
            if (data.success) {
                setLeaderboard(data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-400">Loading leaderboard...</div>;

    const topThree = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <div className="p-6">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-black text-gray-800 flex items-center justify-center gap-3">
                    <Icon path={mdiPodium} size={1.5} className="text-yellow-500" />
                    FARMER LEADERBOARD
                </h1>
                <p className="text-gray-500 mt-2">Top performing farmers based on production output</p>
            </div>

            {/* Top 3 Podium */}
            {topThree.length > 0 && (
                <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-12 h-64">
                    {/* 2nd Place */}
                    {topThree[1] && (
                        <div className="flex flex-col items-center w-full md:w-1/4">
                            <div className="mb-2 text-center">
                                <div className="w-16 h-16 rounded-full bg-gray-200 border-4 border-white shadow-lg mx-auto flex items-center justify-center text-xl font-bold text-gray-500 mb-2">
                                    {topThree[1].petani.nama.charAt(0)}
                                </div>
                                <h3 className="font-bold text-gray-700">{topThree[1].petani.nama}</h3>
                                <p className="text-sm font-bold text-blue-600">{topThree[1].totalWeight.toFixed(1)} kg</p>
                            </div>
                            <div className="w-full bg-gray-300 h-32 rounded-t-xl relative flex justify-center items-start pt-4 shadow-md">
                                <span className="text-4xl font-black text-white opacity-50">2</span>
                            </div>
                        </div>
                    )}

                    {/* 1st Place */}
                    {topThree[0] && (
                        <div className="flex flex-col items-center w-full md:w-1/3 z-10">
                            <div className="mb-2 text-center">
                                <div className="absolute -mt-8 ml-auto mr-auto left-0 right-0 w-8 text-yellow-500 animate-bounce">
                                    <Icon path={mdiMedal} size={2} />
                                </div>
                                <div className="w-20 h-20 rounded-full bg-yellow-100 border-4 border-yellow-400 shadow-xl mx-auto flex items-center justify-center text-2xl font-bold text-yellow-600 mb-2 mt-6">
                                    {topThree[0].petani.nama.charAt(0)}
                                </div>
                                <h3 className="font-bold text-xl text-gray-800">{topThree[0].petani.nama}</h3>
                                <p className="text-lg font-black text-blue-600">{topThree[0].totalWeight.toFixed(1)} kg</p>
                            </div>
                            <div className="w-full bg-yellow-400 h-40 rounded-t-xl relative flex justify-center items-start pt-4 shadow-lg">
                                <span className="text-5xl font-black text-white opacity-50">1</span>
                            </div>
                        </div>
                    )}

                    {/* 3rd Place */}
                    {topThree[2] && (
                        <div className="flex flex-col items-center w-full md:w-1/4">
                            <div className="mb-2 text-center">
                                <div className="w-16 h-16 rounded-full bg-orange-100 border-4 border-white shadow-lg mx-auto flex items-center justify-center text-xl font-bold text-orange-600 mb-2">
                                    {topThree[2].petani.nama.charAt(0)}
                                </div>
                                <h3 className="font-bold text-gray-700">{topThree[2].petani.nama}</h3>
                                <p className="text-sm font-bold text-blue-600">{topThree[2].totalWeight.toFixed(1)} kg</p>
                            </div>
                            <div className="w-full bg-orange-300 h-24 rounded-t-xl relative flex justify-center items-start pt-4 shadow-md">
                                <span className="text-4xl font-black text-white opacity-50">3</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* List for the rest */}
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {rest.map((entry, index) => (
                    <div key={index} className="flex items-center p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <div className="w-10 text-center font-bold text-gray-400">
                            #{index + 4}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 mx-4">
                            {entry.petani.nama.charAt(0)}
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-bold text-gray-800">{entry.petani.nama}</h4>
                            <p className="text-xs text-gray-500">{entry.totalPacking} packs contributed</p>
                        </div>
                        <div className="text-right">
                            <span className="block font-black text-blue-600">{entry.totalWeight.toFixed(1)} kg</span>
                        </div>
                    </div>
                ))}

                {rest.length === 0 && topThree.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                        No ranking data available yet. Start packing to see results!
                    </div>
                )}
            </div>
        </div>
    );
}
