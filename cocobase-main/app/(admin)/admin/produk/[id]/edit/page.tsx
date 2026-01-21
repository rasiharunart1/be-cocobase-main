import Form from "@/app/ui/admin/produk/formUpdate";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Produk",
};

export default async function Page(props: {params: Promise<{ id: string }>;}) {
  const params = await props.params;
  const id = params.id;

  return (
    <div className="">
        <Form id={id} />
    </div>
  );
}
