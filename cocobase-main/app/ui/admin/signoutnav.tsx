"use client";

import { SignOut } from "@/app/utils/actions";
import { PowerIcon } from "@heroicons/react/24/outline";
import { useActionState } from "react";

export default function FormSignOutNav() {
  const [code, action] = useActionState(SignOut, undefined);

  return (
    <form action={action} className="md:w-[95%]">
    {/* <form className="md:w-[95%]"> */}
      <button className="flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-white p-3 text-sm font-medium text-[#202224] hover:bg-[#00B69B] hover:text-white md:flex-none md:justify-start md:p-2 md:px-3">
        <PowerIcon className="w-6" />
        <div className="hidden md:block">Sign Out</div>
      </button>
    </form>
  );
}
