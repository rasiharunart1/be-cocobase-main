export async function fetchPetanisFromDB() {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
        const res = await fetch(`${apiUrl}/petani?limit=100`, {
            cache: 'no-store'
        });

        const data = await res.json();

        if (!data.success) {
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
