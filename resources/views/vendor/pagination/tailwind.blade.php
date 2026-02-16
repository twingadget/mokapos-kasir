@if ($paginator->hasPages())
    <nav role="navigation" aria-label="{{ __('Pagination Navigation') }}" class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex justify-between gap-2 sm:hidden">
            @if ($paginator->onFirstPage())
                <span class="inline-flex h-10 min-w-[96px] items-center justify-center rounded-xl border border-moka-line bg-[#151515] px-4 text-sm font-semibold text-moka-muted/60">
                    {!! __('pagination.previous') !!}
                </span>
            @else
                <a href="{{ $paginator->previousPageUrl() }}" class="inline-flex h-10 min-w-[96px] items-center justify-center rounded-xl border border-moka-line bg-[#151515] px-4 text-sm font-semibold text-moka-muted transition hover:border-moka-primary/60 hover:bg-[#202020] hover:text-moka-ink">
                    {!! __('pagination.previous') !!}
                </a>
            @endif

            @if ($paginator->hasMorePages())
                <a href="{{ $paginator->nextPageUrl() }}" class="inline-flex h-10 min-w-[96px] items-center justify-center rounded-xl border border-moka-line bg-[#151515] px-4 text-sm font-semibold text-moka-muted transition hover:border-moka-primary/60 hover:bg-[#202020] hover:text-moka-ink">
                    {!! __('pagination.next') !!}
                </a>
            @else
                <span class="inline-flex h-10 min-w-[96px] items-center justify-center rounded-xl border border-moka-line bg-[#151515] px-4 text-sm font-semibold text-moka-muted/60">
                    {!! __('pagination.next') !!}
                </span>
            @endif
        </div>

        <div class="hidden items-center justify-between gap-4 sm:flex sm:w-full">
            <p class="text-sm text-moka-muted">
                {!! __('Showing') !!}
                @if ($paginator->firstItem())
                    <span class="font-semibold text-moka-ink">{{ $paginator->firstItem() }}</span>
                    {!! __('to') !!}
                    <span class="font-semibold text-moka-ink">{{ $paginator->lastItem() }}</span>
                @else
                    {{ $paginator->count() }}
                @endif
                {!! __('of') !!}
                <span class="font-semibold text-moka-ink">{{ $paginator->total() }}</span>
                {!! __('results') !!}
            </p>

            <div class="inline-flex overflow-hidden rounded-xl border border-moka-line bg-[#151515]">
                {{-- Previous Page Link --}}
                @if ($paginator->onFirstPage())
                    <span aria-disabled="true" aria-label="{{ __('pagination.previous') }}" class="inline-flex h-10 min-w-10 items-center justify-center border-r border-moka-line px-3 text-moka-muted/50">
                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                    </span>
                @else
                    <a href="{{ $paginator->previousPageUrl() }}" rel="prev" aria-label="{{ __('pagination.previous') }}" class="inline-flex h-10 min-w-10 items-center justify-center border-r border-moka-line px-3 text-moka-muted transition hover:bg-[#202020] hover:text-moka-ink">
                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                    </a>
                @endif

                {{-- Pagination Elements --}}
                @foreach ($elements as $element)
                    {{-- "Three Dots" Separator --}}
                    @if (is_string($element))
                        <span class="inline-flex h-10 min-w-10 items-center justify-center border-r border-moka-line px-3 text-sm font-semibold text-moka-muted">
                            {{ $element }}
                        </span>
                    @endif

                    {{-- Array Of Links --}}
                    @if (is_array($element))
                        @foreach ($element as $page => $url)
                            @if ($page == $paginator->currentPage())
                                <span aria-current="page" class="inline-flex h-10 min-w-10 items-center justify-center border-r border-moka-accent bg-moka-primary px-3 text-sm font-bold text-[#1A1408]">
                                    {{ $page }}
                                </span>
                            @else
                                <a href="{{ $url }}" aria-label="{{ __('Go to page :page', ['page' => $page]) }}" class="inline-flex h-10 min-w-10 items-center justify-center border-r border-moka-line px-3 text-sm font-semibold text-moka-muted transition hover:bg-[#202020] hover:text-moka-ink">
                                    {{ $page }}
                                </a>
                            @endif
                        @endforeach
                    @endif
                @endforeach

                {{-- Next Page Link --}}
                @if ($paginator->hasMorePages())
                    <a href="{{ $paginator->nextPageUrl() }}" rel="next" aria-label="{{ __('pagination.next') }}" class="inline-flex h-10 min-w-10 items-center justify-center px-3 text-moka-muted transition hover:bg-[#202020] hover:text-moka-ink">
                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        </svg>
                    </a>
                @else
                    <span aria-disabled="true" aria-label="{{ __('pagination.next') }}" class="inline-flex h-10 min-w-10 items-center justify-center px-3 text-moka-muted/50">
                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        </svg>
                    </span>
                @endif
            </div>
        </div>
    </nav>
@endif