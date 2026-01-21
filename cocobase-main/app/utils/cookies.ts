"use server";

import { cookies } from "next/headers";

export async function setCookiesToken(token: string) {
  try {
    (await cookies()).set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: true,
      // path: "/auth/login",
      maxAge: 86400,
      sameSite: "strict",
    });

  } catch (error) {
    console.log("Set cookies", error);
  }
}

export async function getCookiesToken() {
  try {
    const token = (await cookies()).get("token");
    console.log(token, "get token");
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
