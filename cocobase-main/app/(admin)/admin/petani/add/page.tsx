import Form from "@/app/ui/admin/petani/form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Petani",
};

export default function Page() {
  return (
    <div className="">
        <Form />
    </div>
  );
}
