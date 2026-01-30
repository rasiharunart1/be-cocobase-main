import { Metadata } from "next";
import HomeView from "./HomeView";

export const metadata: Metadata = {
  title: "Cocobase",
  description: "Cocobase adalah website yang menjual gula kelapa alami.",
  openGraph: {
    title: "Cocobase",
    description: "Cocobase adalah website yang menjual gula kelapa alami.",
    url: "https://cocobase-beta.vercel.app/",
    siteName: "Cocobase",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cocobase",
    description: "Cocobase adalah website yang menjual gula kelapa alami.",
    images: [
      {
        url: "https://cocobase-beta.vercel.app/home.png",
        width: 500,
        height: 500,
        alt: "Cocobase",
      },

    ],
  },
};

export default async function Page(props: {
  searchParams?: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";
  const currentPage = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 4;

  return (
    <HomeView
      search={search}
      currentPage={currentPage}
      limit={limit}
    />
  );
}
