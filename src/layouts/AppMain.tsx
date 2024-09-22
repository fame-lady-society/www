import { AppBar } from "@/features/appbar/components.app/AppBar";
import { LinksMenuItems } from "@/features/appbar/components.app/LinksMenuItem";
import { SiteMenu } from "@/features/appbar/components.app/SiteMenu";
import { DesktopHomeMenu } from "@/features/appbar/components.app/DesktopHomeMenu";
import {
  ComponentProps,
  ComponentPropsWithoutRef,
  PropsWithChildren,
  ReactNode,
} from "react";

export function AppMain({
  children,
  isFame,
  isFaq,
  isCustomize,
  isHome,
  isWrap,
  title,
}: PropsWithChildren<
  {
    title?: ReactNode;
  } & ComponentPropsWithoutRef<typeof SiteMenu>
>) {
  const menu = (
    <>
      <li className="border-t border-gray-200 my-2 list-none" />
      <SiteMenu
        isFaq={isFaq}
        isCustomize={isCustomize}
        isHome={isHome}
        isWrap={isWrap}
        isFame={isFame}
      />
      <li className="border-t border-gray-200 my-2 list-none" />
      <LinksMenuItems />
    </>
  );
  return (
    <main className="relative flex w-full flex-col flex-auto">
      <AppBar
        menu={menu}
        title={<h1 className="text-2xl font-bold">{title}</h1>}
      />
      <div className="flex flex-grow min-h-screen-without-header">
        <section className="flex">
          <DesktopHomeMenu>{menu}</DesktopHomeMenu>
        </section>
        <div className="flex-grow">{children}</div>
      </div>
    </main>
  );
}
