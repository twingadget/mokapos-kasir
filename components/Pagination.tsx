import Link from "next/link";

type PaginationProps = {
    basePath: string;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
    query?: Record<string, string | undefined>;
};

function buildHref(basePath: string, page: number, query?: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== "") {
                params.set(key, value);
            }
        }
    }
    params.set("page", String(page));

    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
}

function pageWindow(currentPage: number, totalPages: number): Array<number | "..."> {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: Array<number | "..."> = [1];

    if (currentPage > 4) {
        pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let page = start; page <= end; page += 1) {
        pages.push(page);
    }

    if (currentPage < totalPages - 3) {
        pages.push("...");
    }

    pages.push(totalPages);
    return pages;
}

export default function Pagination({ basePath, currentPage, totalPages, totalItems, perPage, query }: PaginationProps) {
    if (totalPages <= 1) {
        return null;
    }

    const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const lastItem = Math.min(totalItems, currentPage * perPage);
    const pages = pageWindow(currentPage, totalPages);

    const previousHref = buildHref(basePath, Math.max(1, currentPage - 1), query);
    const nextHref = buildHref(basePath, Math.min(totalPages, currentPage + 1), query);

    return (
        <nav role="navigation" aria-label="Pagination Navigation" className="mt-6 flex flex-col gap-3 sm:gap-0">
            <div className="flex justify-between gap-2 sm:hidden">
                {currentPage <= 1 ? (
                    <span className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-xl border border-moka-line bg-[#151515] px-4 text-sm font-semibold text-moka-muted/60">
                        Previous
                    </span>
                ) : (
                    <Link href={previousHref} className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-xl border border-moka-line bg-[#151515] px-4 text-sm font-semibold text-moka-muted transition hover:border-moka-primary/60 hover:bg-[#202020] hover:text-moka-ink">
                        Previous
                    </Link>
                )}

                {currentPage >= totalPages ? (
                    <span className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-xl border border-moka-line bg-[#151515] px-4 text-sm font-semibold text-moka-muted/60">
                        Next
                    </span>
                ) : (
                    <Link href={nextHref} className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-xl border border-moka-line bg-[#151515] px-4 text-sm font-semibold text-moka-muted transition hover:border-moka-primary/60 hover:bg-[#202020] hover:text-moka-ink">
                        Next
                    </Link>
                )}
            </div>

            <div className="hidden items-center justify-end gap-4 sm:flex sm:w-full">
                <p className="text-sm text-moka-muted">
                    Showing <span className="font-semibold text-moka-ink">{firstItem}</span> to <span className="font-semibold text-moka-ink">{lastItem}</span> of{" "}
                    <span className="font-semibold text-moka-ink">{totalItems}</span> results
                </p>

                <div className="inline-flex overflow-hidden rounded-xl border border-moka-line bg-[#151515]">
                    {currentPage <= 1 ? (
                        <span aria-disabled="true" aria-label="pagination.previous" className="inline-flex h-10 min-w-10 items-center justify-center border-r border-moka-line px-3 text-moka-muted/50">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                            </svg>
                        </span>
                    ) : (
                        <Link href={previousHref} aria-label="pagination.previous" className="inline-flex h-10 min-w-10 items-center justify-center border-r border-moka-line px-3 text-moka-muted transition hover:bg-[#202020] hover:text-moka-ink">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                            </svg>
                        </Link>
                    )}

                    {pages.map((page, index) =>
                        page === "..." ? (
                            <span key={`ellipsis-${index}`} className="inline-flex h-10 min-w-10 items-center justify-center border-r border-moka-line px-3 text-sm font-semibold text-moka-muted">
                                ...
                            </span>
                        ) : page === currentPage ? (
                            <span key={page} aria-current="page" className="inline-flex h-10 min-w-10 items-center justify-center border-r border-moka-accent bg-moka-primary px-3 text-sm font-bold text-[#1A1408]">
                                {page}
                            </span>
                        ) : (
                            <Link
                                key={page}
                                href={buildHref(basePath, page, query)}
                                aria-label={`Go to page ${page}`}
                                className="inline-flex h-10 min-w-10 items-center justify-center border-r border-moka-line px-3 text-sm font-semibold text-moka-muted transition hover:bg-[#202020] hover:text-moka-ink"
                            >
                                {page}
                            </Link>
                        ),
                    )}

                    {currentPage >= totalPages ? (
                        <span aria-disabled="true" aria-label="pagination.next" className="inline-flex h-10 min-w-10 items-center justify-center px-3 text-moka-muted/50">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                            </svg>
                        </span>
                    ) : (
                        <Link href={nextHref} aria-label="pagination.next" className="inline-flex h-10 min-w-10 items-center justify-center px-3 text-moka-muted transition hover:bg-[#202020] hover:text-moka-ink">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                            </svg>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
