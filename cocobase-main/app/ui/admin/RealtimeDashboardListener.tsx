"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RealtimeDashboardListener() {
    const router = useRouter();

    useEffect(() => {
        // Poll for updates every 5 seconds
        const interval = setInterval(() => {
            router.refresh(); // Triggers server component re-fetch
        }, 5000);

        return () => {
            clearInterval(interval);
        };
    }, [router]);

    return null; // This component renders nothing
}
