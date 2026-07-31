"use client";

import { Suspense, type ComponentProps } from "react";
import Link from "next/link";
import { useSeasonHref } from "@/lib/season-link";

type SeasonLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

function SeasonLinkInner({ href, children, ...rest }: SeasonLinkProps) {
    const seasonHref = useSeasonHref();
    return (
        <Link href={seasonHref(href)} {...rest}>
            {children}
        </Link>
    );
}

/**
 * Link interno che si porta dietro la stagione selezionata in alto a destra.
 *
 * `useSearchParams` costringe Next a rendere il ramo lato client: il boundary
 * qui dentro isola il problema al singolo link, e il fallback è esattamente lo
 * stesso link senza query — cioè il comportamento giusto per la stagione in
 * corso, che è il caso normale.
 */
export function SeasonLink({ href, children, ...rest }: SeasonLinkProps) {
    return (
        <Suspense
            fallback={
                <Link href={href} {...rest}>
                    {children}
                </Link>
            }
        >
            <SeasonLinkInner href={href} {...rest}>
                {children}
            </SeasonLinkInner>
        </Suspense>
    );
}
