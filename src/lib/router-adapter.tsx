"use client";

import React from "react";
import NextLink from "next/link";
import { useRouter, usePathname, useParams as useNextParams, useSearchParams } from "next/navigation";

export const useNavigate = () => {
  const router = useRouter();
  return (to: string | number, options?: any) => {
    if (typeof to === "number") {
      if (to === -1) router.back();
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
};

export const useLocation = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return {
    pathname: pathname || "/",
    search: searchParams?.toString() ? `?${searchParams.toString()}` : "",
    hash: "",
    state: null,
    key: "default",
  };
};

export const useParams = () => {
  const params = useNextParams();
  return (params || {}) as Record<string, string>;
};

export const Link = React.forwardRef<HTMLAnchorElement, any>(
  ({ to, href, children, className, onClick, ...props }, ref) => {
    const targetHref = to || href || "#";
    return (
      <NextLink href={targetHref} className={className} onClick={onClick} ref={ref} {...props}>
        {children}
      </NextLink>
    );
  }
);

Link.displayName = "Link";

export interface NavLinkProps {
  to: string;
  className?: string | ((props: { isActive: boolean; isPending: boolean }) => string);
  children?: React.ReactNode;
  [key: string]: any;
}

export const NavLink = Link;
export const BrowserRouter = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const Routes = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export interface RouteProps {
  path?: string;
  element?: React.ReactNode;
  children?: React.ReactNode;
  [key: string]: any;
}

export const Route: React.FC<RouteProps> = () => null;
