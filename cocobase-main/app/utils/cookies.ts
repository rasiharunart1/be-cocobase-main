"use server";

import { cookies } from "next/headers";

export async function setCookiesToken(token: string) {
  console.log("[DEBUG] Setting cookie token:", token ? "Token present" : "Token empty");
  try {
    (await cookies()).set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: "/",
      maxAge: 86400,
      sameSite: "lax",
    });

  } catch (error) {
    console.log("Set cookies", error);
  }
}

export async function getCookiesToken() {
  try {
    const token = (await cookies()).get("token");
    console.log("[DEBUG] getCookiesToken result:", token ? "Found" : "Missing");
    return token;
  } catch (error) {
    console.log("Get cookies", error);
  }
}

export async function getAllCookies() {
  const token = (await cookies()).getAll();
  console.log(token, "tokenapapa");
  return token;
}

export async function removeCookiesToken() {
  (await cookies()).delete("token");
}
