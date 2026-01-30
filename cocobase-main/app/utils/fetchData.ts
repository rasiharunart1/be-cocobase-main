"use server";
import { cookies } from "next/headers";

export async function getData({
  path,
  currentPage,
  limit,
  search,
  status,
}: {
  path: string;
  currentPage?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const token = (await cookies()).get("token");

  // Construct query parameters, filtering out undefined/null/empty string values
  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  if (status) queryParams.append("status", status);
  if (currentPage) queryParams.append("page", currentPage.toString());
  if (limit) queryParams.append("limit", limit.toString());

  const queryString = queryParams.toString();
  const url = `${process.env.NEXT_PUBLIC_API_URL}${path}${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token?.value}`,
      "Content-Type": "application/json",
    },
  });

  // if (!res.ok) {
  //   throw new Error(`HTTP error! status: ${res.status}`);
  // }

  const data = await res.json();
  // console.log("data", data)

  // await new Promise((resolve) => setTimeout(resolve, 4000));  

  return data.data;
}


export async function getDataNoQuery({
  path,
}: {
  path: string;
}) {
  const token = (await cookies()).get("token");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${path}?limit=100`,
    {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token?.value}`,
        "Content-Type": "application/json",
      },
    }
  );

  // if (!res.ok) {
  //   throw new Error(`HTTP error! status: ${res.status}`);
  // }

  const data = await res.json();
  // console.log(data);


  // await new Promise((resolve) => setTimeout(resolve, 8000));  

  return data.data;
}
