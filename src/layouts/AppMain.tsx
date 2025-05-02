import { AppBar } from "@/features/appbar/components.app/AppBar";
import { LinksMenuItems } from "@/features/appbar/components.app/LinksMenuItem";
import { SiteMenu } from "@/features/appbar/components.app/SiteMenu";
import { DesktopHomeMenu } from "@/features/appbar/components.app/DesktopHomeMenu";
import { ComponentPropsWithoutRef, PropsWithChildren, ReactNode } from "react";
import { ClaimFame } from "@/features/appbar/components.app/ClaimFame";

export function AppMain({
  headerLeft,
  headerRight,
  children,
  isFame,
  isFaq,
  isCustomize,
  isHome,
  isWrap,
  title,
  mobileTitle,
  disableConnect,
  disableDesktopMenu,
  fixedHeader,
}: PropsWithChildren<
  {
    title?: ReactNode;
    mobileTitle?: ReactNode;
    headerLeft?: ReactNode;
    headerRight?: ReactNode;
    disableConnect?: boolean;
    disableDesktopMenu?: boolean;
    fixedHeader?: boolean;
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
    <main className="relative flex w-full h-full flex-col flex-auto">
      <AppBar
        disableConnect={disableConnect}
        menu={menu}
        title={
          <>
            <h1 className="text-2xl font-bold hidden lg:block">{title}</h1>
            <h1 className="text-2xl font-bold lg:hidden">
              {mobileTitle || title}
            </h1>
            {headerLeft}
          </>
        }
        right={
          <>
            {headerRight}
            <ClaimFame />
          </>
        }
        fixed={fixedHeader}
      />
      <div
        className={`flex flex-grow min-h-screen-without-header ${fixedHeader ? "pt-20 lg:pt-24" : ""}`}
      >
        {!disableDesktopMenu && (
          <div className="lg:flex hidden">
            <DesktopHomeMenu>{menu}</DesktopHomeMenu>
          </div>
        )}
        <div className="flex-grow">{children}</div>
      </div>
    </main>
  );
}
