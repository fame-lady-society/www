"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const destinations = [
  ["FAME Marketplace", "/fame/market"],
  ["FAME Gallery", "/fame/gallery"],
  ["Rotator", "/fame/rotate"],
] as const;

export function FameLandingMenu() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, []);
  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        aria-label="Open FAME navigation"
        aria-expanded={open}
        aria-controls="fame-navigation"
        className="grid min-h-12 min-w-12 place-items-center rounded border border-[#8e762c] p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5d46d]"
        onClick={() => setOpen(!open)}
      >
        <Image
          src="/images/fame/gold-leaf-square.png"
          width={38}
          height={38}
          alt=""
          priority
        />
      </button>
      {open ? (
        <nav
          id="fame-navigation"
          aria-label="FAME navigation"
          className="absolute right-0 z-10 mt-2 min-w-52 border border-[#8e762c] bg-black p-2 shadow-xl"
        >
          {destinations.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="block min-h-11 px-3 py-2 text-[#fff5d8] hover:bg-[#2c2511] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5d46d]"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
