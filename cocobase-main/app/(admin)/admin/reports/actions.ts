"use server";

import { cookies } from "next/headers";

export async function fetchPetanisFromDB() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        console.log("[DEBUG] Token from cookies:", token ? `${token.substring(0, 10)}...` : "MISSING");

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${apiUrl}/petani?limit=100`, {
            headers,
            cache: 'no-store'
        });

        const data = await res.json();

        if (!data.success) {
            // handle 401 specifically
            if (res.status === 401) {
                throw new Error("Unauthorized: Please login again");
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
