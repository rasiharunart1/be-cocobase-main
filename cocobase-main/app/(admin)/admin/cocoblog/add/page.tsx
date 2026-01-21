import Form from "@/app/ui/admin/cocoblog/form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cocoblog",
};

export default function Page() {
  return (
    <div className="">
        <Form />
    </div>
  );
}
