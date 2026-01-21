import Icon from "@mdi/react";
import {
  mdiDeleteOutline,
  mdiArrowUpBoldBoxOutline,
  mdiExpandAll,
} from "@mdi/js";
import Link from "next/link";

export default function SkeletonTable() {
  return (
    <div className="flex flex-col items-center">
      <table className="w-full border-collapse border border-gray-300 animate-pulse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">No</th>
            <th className="border border-gray-300 p-2">Nama</th>
            <th className="border border-gray-300 p-2">Alamat</th>
            <th className="border border-gray-300 p-2">Telepon</th>
            <th className="border border-gray-300 p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((index) => (
            <tr key={index} className="animate-pulse">
              <td className="border border-gray-300 p-[6px] text-center bg-gray-300 h-6 w-6 rounded"></td>
              <td className="border border-gray-300 p-[6px] bg-gray-300 h-6 w-1/2 rounded"></td>
              <td className="border border-gray-300 p-[6px] bg-gray-300 h-6 w-1/2 rounded"></td>
              <td className="border border-gray-300 p-[6px] bg-gray-300 h-6 w-1/2 rounded"></td>
              <td className="border border-gray-300 p-[6px]">
                <div className="flex justify-center space-x-2">
                  <Link
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-fit p-1 rounded"
                    href="#"
                  >
                    <Icon path={mdiExpandAll} size={1} color="#fff" />
                  </Link>
                  <Link
                    href="#"
                    className="bg-green-500 hover:bg-green-700 text-white font-bold w-fit p-1 rounded"
                  >
                    <Icon
                      path={mdiArrowUpBoldBoxOutline}
                      size={1}
                      color="#fff"
                    />
                  </Link>
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold w-fit p-1 rounded"
                  >
                    <Icon path={mdiDeleteOutline} size={1} color="#fff" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-5"></div>
      <div className="bg-gray-300 h-6 w-1/2 rounded animate-pulse"></div>
    </div>
  );
}