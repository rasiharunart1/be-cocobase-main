import Form from "@/app/ui/admin/produksi/form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Produksi",
};

export default function Page() {
  return (
    <div className="">
        <Form />
    </div>
  );
}
