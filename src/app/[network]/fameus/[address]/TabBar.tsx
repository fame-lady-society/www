"use client";

import { FC, useCallback } from "react";
import cn from "classnames";
import { useRouter } from "next/navigation";

export const TabBar: FC<{
  activeTab: "wrap" | "governance";
}> = ({ activeTab }) => {
  const router = useRouter();

  const onClickWrap = useCallback(() => {
    const currentPath = window.location.pathname;
    // replace the last part of the path with wrap
    const newPath = currentPath.replace(/\/[^\/]+$/, "/wrap");
    router.push(newPath);
  }, [router]);

  const onClickGovernance = useCallback(() => {
    const currentPath = window.location.pathname;
    // replace the last part of the path with manage
    const newPath = currentPath.replace(/\/[^\/]+$/, "/governance");
    router.push(newPath);
  }, [router]);

  return (
    <div className="flex flex-col">
      <div className="flex gap-4 mb-6">
        <button
          className={cn(
            "px-4 py-2 border-2 rounded-md",
            activeTab === "wrap"
              ? "bg-gray-500 text-white"
              : "text-blue-800 border-blue-800",
          )}
          onClick={onClickWrap}
        >
          Wrap
        </button>
        <button
          className={cn(
            "px-4 py-2 border-2 rounded-md",
            activeTab === "governance"
              ? "bg-gray-500 text-white"
              : "text-blue-800 border-blue-800",
          )}
          onClick={onClickGovernance}
        >
          Governance
        </button>
      </div>
      <hr className="border-gray-200 w-full mb-6" />
    </div>
  );
};
