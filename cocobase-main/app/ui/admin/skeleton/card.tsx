import Icon from "@mdi/react";
import {
  mdiArrowRight,
} from "@mdi/js";

export function SkeletonCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 m-auto w-full mt-5 gap-3">
      {Array(4).fill(null).map((_, index: number) => (
      <div
        key={index}
        className="flex flex-row justify-start md:flex-col bg-white rounded-lg shadow-md mt-3 h-full animate-pulse"
      >
        <div className="w-full h-[200px] bg-gray-200 rounded-lg"></div>
        <div className="flex items-center justify-center my-3 ml-1 md:ml-0 w-[50%] md:w-full">
          <div className="w-[90%]">
            <h3 className="text-black text-xl font-medium mb-3">
              <div className="w-full h-6 bg-gray-200 rounded-lg"></div>
            </h3>
            <p className="text-black text-sm line-clamp-3">
              <div className="w-full h-4 bg-gray-200 rounded-lg"></div>
              <div className="w-full h-4 bg-gray-200 rounded-lg"></div>
              <div className="w-full h-4 bg-gray-200 rounded-lg"></div>
            </p>
          </div>
        </div>
        <div className="w-[90%] mx-auto mb-3 mt-auto flex gap-2">
          <div className="text-[#E37D2E] grow p-1 rounded">
            <div className="flex w-fit items-center gap-2">
              <p className="text-left hover:underline">
                <span>
                  <div className="w-full h-6 bg-gray-200 rounded-lg"><p className="w-20"></p></div>
                </span>{" "}
              </p>
              <Icon path={mdiArrowRight} size={0.7} color="#E37D2E" />
            </div>
          </div>
        </div>
      </div>
      ))}
    </div>
  );
}