"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { PropsWithChildren, useState } from "react";

export function FameEmotionRegistry({ children }: PropsWithChildren) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: "fame" });
    cache.compat = true;

    const previousInsert = cache.insert;
    let insertedNames: string[] = [];

    cache.insert = (...args) => {
      const serialized = args[1];

      if (cache.inserted[serialized.name] === undefined) {
        insertedNames.push(serialized.name);
      }

      return previousInsert(...args);
    };

    const flush = () => {
      const names = insertedNames;
      insertedNames = [];
      return names;
    };

    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();

    if (names.length === 0) {
      return null;
    }

    const styles = names.map((name) => cache.inserted[name]).join("");

    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
