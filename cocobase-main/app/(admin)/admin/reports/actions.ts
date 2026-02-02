"use server";

import { cookies } from "next/headers";

export async function fetchPetanisFromDB() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

        console.log("[DEBUG] START fetchPetanisFromDB");
        console.log("[DEBUG] API URL:", apiUrl);
        console.log("[DEBUG] Token found:", !!token);

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            console.log("[DEBUG] WARNING: No token available in cookies!");
        }

        const res = await fetch(`${apiUrl}/petani?limit=100`, {
            headers,
            cache: 'no-store'
        });

        console.log("[DEBUG] Response Status:", res.status);

        const data = await res.json();

        if (!data.success) {
            console.log("[DEBUG] API Error Body:", JSON.stringify(data, null, 2));
            // handle 401 specifically
            if (res.status === 401) {
                throw new Error(`Unauthorized: ${data.err || data.message || "Please login again"}`);
            }
            throw new Error(data.message || "Failed to fetch from API");
        }

        return {
            success: true,
            data: data.petani || [], // mapping backend response
        };
    } catch (error) {
        console.error("Error fetching petanis from API:", error);
        return {
            success: false,
            data: [],
            error: (error as Error).message,
        };
    }
}
