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
    <div className="flex gap-4 mb-6">
      <button
        className={cn(
          "px-4 py-2 border-2   rounded-m",
          activeTab === "wrap"
            ? "bg-blue-500 text-white"
            : "text-blue-500 border-blue-500",
        )}
        onClick={onClickWrap}
      >
        Wrap
      </button>
      <button
        className={cn(
          "px-4 py-2 border-2 border-blue-500 rounded-md",
          activeTab === "governance"
            ? "bg-blue-500 text-white"
            : "text-blue-500",
        )}
        onClick={onClickGovernance}
      >
        Governance
      </button>
    </div>
  );
};
