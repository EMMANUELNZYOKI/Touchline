"use client";

import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import type { ComponentType, AnchorHTMLAttributes, ReactNode } from "react";

type RouteConfig = {
  component?: ComponentType;
  [key: string]: unknown;
};

type NavigationTarget = {
  to: string;
  params?: Record<string, string | number>;
  search?: Record<string, string | number | boolean | undefined>;
  replace?: boolean;
};

type TouchlineLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  params?: Record<string, string | number>;
  search?: Record<string, string | number | boolean | undefined>;
  children: ReactNode;
};

function resolveHref(
  to: string,
  params?: Record<string, string | number>,
  search?: Record<string, string | number | boolean | undefined>,
) {
  let href = to.replace(/\$([A-Za-z0-9_]+)/g, (match, key: string) => {
    const value = params?.[key];
    return value === undefined ? match : encodeURIComponent(String(value));
  });
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(search ?? {})) {
    if (value !== undefined) query.set(key, String(value));
  }
  const queryString = query.toString();
  if (queryString) href += `${href.includes("?") ? "&" : "?"}${queryString}`;
  return href;
}

export function Link({ to, params, search, children, ...props }: TouchlineLinkProps) {
  return (
    <NextLink href={resolveHref(to, params, search)} {...props}>
      {children}
    </NextLink>
  );
}

export function createFileRoute(_path: string) {
  return function <T extends RouteConfig>(config: T) {
    return Object.assign(config, {
      useParams: () => useNextParams() as Record<string, string>,
      useSearch: () => Object.fromEntries(useSearchParams().entries()),
      useRouteContext: () => ({}),
    });
  };
}

export function useNavigate() {
  const router = useRouter();
  return async (target: NavigationTarget | string) => {
    const options = typeof target === "string" ? { to: target } : target;
    const href = resolveHref(options.to, options.params, options.search);
    if (options.replace) router.replace(href);
    else router.push(href);
  };
}

export function useRouterState<T>({
  select,
}: {
  select: (state: { location: { pathname: string } }) => T;
}) {
  const pathname = usePathname();
  return select({ location: { pathname } });
}
