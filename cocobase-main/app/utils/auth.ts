import {
  setCookiesToken,
  removeCookiesToken,
} from "@/app/utils/cookies";
import { z } from "zod";
import { NextResponse } from 'next/server';

export const signIn = async (provider: string, data: any) => {
  try {
    const parsedCredentials = z
      .object({ username: z.string(), password: z.string().min(5) })
      .safeParse(data);

    if (parsedCredentials.success) {
      const { username, password } = data;

      const user = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      if (!user) return null;
      if (user.status === 200) {
        const data = await user.json();

        const response = NextResponse.next();
        response.cookies.set('token', data.token, {
          path: '/',
          maxAge: 3600, // 1 jam
          sameSite: 'strict',
        });

        localStorage.setItem("token", data.token);
        await setCookiesToken(data.token);

        return data;
      } else {
        return await user.json();
      }
    }
  } catch (error) {
    console.log("err :", error);
  }
};

export const signUp = async (provider: string, data: any) => {
  const parsedCredentials = z
    .object({ username: z.string(), password: z.string().min(5) })
    .safeParse(data);

  if (parsedCredentials.success) {
    const { username, password, authCode } = data;

    const user = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, authCode }),
      }
    );

    if (!user) return null;
    if (user.status === 200) {
      const data = await user.json();

      localStorage.setItem("token", data.token);
      await setCookiesToken(data.token);

      return data;
    } else {
      return await user.json();
    }
  }
};

export const signOut = async () => {
  removeCookiesToken();
};
