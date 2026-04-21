@props([
    'name',
    'maxWidth' => '2xl',
])

@php
    $maxWidthValue = [
        'sm' => '24rem',
        'md' => '28rem',
        'lg' => '32rem',
        'xl' => '36rem',
        '2xl' => '42rem',
        '4xl' => '56rem',
    ][$maxWidth] ?? '42rem';
@endphp

<template x-teleport="body">
    <div
        x-cloak
        x-show="{{ $name }}"
        x-on:keydown.escape.window="{{ $name }} = false"
        class="fixed inset-0 z-[120]"
    >
        <div
            x-show="{{ $name }}"
            x-transition.opacity.duration.200ms
            x-on:click="{{ $name }} = false"
            class="absolute inset-0 moka-modal-overlay backdrop-blur-sm"
        ></div>

        <div
            x-show="{{ $name }}"
            x-transition.opacity.duration.200ms
            class="relative flex min-h-full items-center justify-center p-4 sm:p-6"
        >
            <div
                class="moka-modal-shell pointer-events-auto w-full overflow-y-auto overscroll-contain"
                style="max-width: {{ $maxWidthValue }}; max-height: calc(100dvh - 2rem);"
            >
                {{ $slot }}
            </div>
        </div>
    </div>
</template>
