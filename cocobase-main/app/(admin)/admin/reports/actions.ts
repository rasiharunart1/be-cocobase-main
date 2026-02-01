"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function fetchPetanisFromDB() {
    try {
        const petanis = await prisma.petani.findMany({
            select: {
                id: true,
                nama: true,
                alamat: true,
                no_hp: true,
                RT: true,
                RW: true,
            },
            orderBy: {
                nama: 'asc',
            },
            take: 100,
        });

        return {
            success: true,
            data: petanis,
        };
    } catch (error) {
        console.error("Error fetching petanis from DB:", error);
        return {
            success: false,
            data: [],
            error: (error as Error).message,
        };
    }
}
