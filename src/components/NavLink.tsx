"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, type MouseEventHandler, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  end?: boolean;
  className?: string;
  activeClassName?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
}

/**
 * Drop-in replacement for the old react-router `<NavLink>`: an `next/link` that
 * derives its active state from `usePathname()`. `end` mirrors react-router's
 * `end` prop (exact match only, used for the homepage `/`).
 */
const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ href, end, className, activeClassName, onClick, children }, ref) => {
    const pathname = usePathname() ?? "";
    const isActive = end
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        ref={ref}
        href={href}
        onClick={onClick}
        className={cn(className, isActive && activeClassName)}
      >
        {children}
      </Link>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
