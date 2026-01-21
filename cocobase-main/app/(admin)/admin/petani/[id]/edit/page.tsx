import Form from "@/app/ui/admin/petani/formUpdate";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Petani",
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
