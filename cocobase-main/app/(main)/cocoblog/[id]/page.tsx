import type { Metadata, ResolvingMetadata } from "next";
import { getData } from "@/app/utils/fetchData";
import Image from "next/image";
import { Footer, Chat } from "@/app/(main)/HomeView";
import DOMPurify from "isomorphic-dompurify";

type Props = {
  params: { id: string }; // ✅ Pastikan params tidak menggunakan Promise
  searchParams?: { [key: string]: string | string[] | undefined };
};

// Fungsi membersihkan HTML sebelum ditampilkan (sanitize)
const sanitizeHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"],
  });
};

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params; // ✅ Await params

  // Ambil data artikel berdasarkan ID
  const data = await getData({ path: `/cocoblog/${id}` });

  return {
    title: data ? `${data.judul} - Cocoblog` : "Artikel tidak ditemukan - Cocoblog",
    description: data?.deskripsi || "Baca artikel menarik di Cocoblog.",
    openGraph: {
      title: data ? `${data.judul} - Cocoblog` : "Artikel tidak ditemukan",
      description: data?.deskripsi || "Baca artikel menarik di Cocoblog.",
      url: `https://cocobase-beta.vercel.app/cocoblog/${id}`,
      siteName: "Cocoblog",
      type: "article",
      images: data?.gambar ? [data.gambar] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: data ? `${data.judul} - Cocoblog` : "Artikel tidak ditemukan",
      description: data?.deskripsi || "Baca artikel menarik di Cocoblog.",
      images: data?.gambar ? [data.gambar] : [],
    },
  };
}


// Komponen Halaman Artikel
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const data = await getData({
    path: `/cocoblog/${id}`,
  });

  return (
    <div className="mt-10">
      <Chat />
      {!data ? (
        <div className="text-center mt-20 text-xl font-semibold">
          Artikel tidak ditemukan
        </div>
      ) : (
        <div className="container w-[50%] mx-auto mt-20">
          <Image
            src={data.gambar}
            alt={data.judul}
            width={1200}
            height={1200}
            className="object-cover rounded-lg w-full max-h-[400px]"
          />
          <div className="mt-5 mb-10">
            <h1 className="text-2xl text-center font-semibold">{data.judul}</h1>
            <article
              className="prose prose-slate max-w-none mt-2"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(data.isi),
              }}
            />
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
