import React, { FC, PropsWithChildren } from "react";

export const DesktopHomeMenu: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="bg-gray-800 shadow-xl w-96 flex flex-col h-full">
      <div className="px-4 sm:px-6 py-6">
        <h2 className="text-base font-semibold leading-6 text-gray-100">
          Links
        </h2>
      </div>
      <div className="flex-grow px-4 sm:px-6 overflow-y-auto text-gray-300">
        {children}
      </div>
    </div>
  );
};
