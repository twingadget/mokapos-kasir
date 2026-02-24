import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { SessionUser } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";

type PosTemplateData = {
    mode: "kasir" | "waiter";
    user: SessionUser;
    payload: {
        categories: unknown;
        products: unknown;
        addons: unknown;
        paymentMethods: unknown;
        openBills: unknown;
        waiterOrders: unknown;
        resumeOpenBill: unknown;
        resumeWaiterOrder: unknown;
    };
};

function loadSourceTemplate(): string {
    return readFileSync(path.join(process.cwd(), "resources", "views", "pos", "index.blade.php"), "utf8");
}

type ViteManifestEntry = {
    file?: string;
    css?: string[];
};

function toBuildAssetPath(value: string | undefined): string | null {
    if (!value) {
        return null;
    }

    const normalized = value.replace(/^\/+/, "");
    if (normalized === "") {
        return null;
    }

    return `/build/${normalized}`;
}

function fallbackViteAssetTags(): string {
    const hardcodedFallback = '<link rel="stylesheet" href="/build/assets/app-t25bkjUN.css">\n    <script type="module" src="/build/assets/app-BvlwmeRr.js"></script>';

    try {
        const assetsDir = path.join(process.cwd(), "public", "build", "assets");
        const entries = readdirSync(assetsDir, { withFileTypes: true });

        const jsFiles = entries
            .filter((entry) => entry.isFile() && /^app-.*\.js$/i.test(entry.name))
            .map((entry) => entry.name)
            .sort();

        if (jsFiles.length === 0) {
            return hardcodedFallback;
        }

        const cssFiles = entries
            .filter((entry) => entry.isFile() && /^app-.*\.css$/i.test(entry.name))
            .map((entry) => entry.name)
            .sort();

        const cssTags = cssFiles.map((file) => `<link rel="stylesheet" href="/build/assets/${file}">`).join("\n    ");
        const jsTag = `<script type="module" src="/build/assets/${jsFiles[jsFiles.length - 1]}"></script>`;

        if (cssTags !== "") {
            return `${cssTags}\n    ${jsTag}`;
        }

        return jsTag;
    } catch {
        return hardcodedFallback;
    }
}

function resolveViteAssetTags(): string {
    const fallback = fallbackViteAssetTags();

    try {
        const manifestPath = path.join(process.cwd(), "public", "build", "manifest.json");
        const rawManifest = readFileSync(manifestPath, "utf8");
        const manifest = JSON.parse(rawManifest) as Record<string, ViteManifestEntry>;

        const jsEntry = manifest["resources/js/app.js"];
        const cssEntry = manifest["resources/css/app.css"];

        const jsPath = toBuildAssetPath(jsEntry?.file);
        if (!jsPath) {
            return fallback;
        }

        const cssPaths = new Set<string>();
        const directCssPath = toBuildAssetPath(cssEntry?.file);
        if (directCssPath) {
            cssPaths.add(directCssPath);
        }

        for (const cssFile of jsEntry?.css ?? []) {
            const cssPath = toBuildAssetPath(cssFile);
            if (cssPath) {
                cssPaths.add(cssPath);
            }
        }

        const cssTags = [...cssPaths].map((href) => `<link rel="stylesheet" href="${href}">`).join("\n    ");

        if (cssTags !== "") {
            return `${cssTags}\n    <script type="module" src="${jsPath}"></script>`;
        }

        return `<script type="module" src="${jsPath}"></script>`;
    } catch {
        return fallback;
    }
}

function runtimeFallbackScriptTag(): string {
    return `<script>
    (() => {
        function hydrateMobileTableLabels() {
            document.querySelectorAll('table.moka-table-mobile').forEach((table) => {
                const labels = Array.from(table.querySelectorAll('thead th')).map((th) =>
                    (th.textContent || '').replace(/\\s+/g, ' ').trim(),
                );

                table.querySelectorAll('tbody tr').forEach((row) => {
                    const cells = Array.from(row.children).filter((cell) => cell.tagName === 'TD');

                    cells.forEach((cell, index) => {
                        if (cell.hasAttribute('colspan')) {
                            cell.removeAttribute('data-label');
                            return;
                        }

                        const label = labels[index] || '';
                        if (label !== '') {
                            cell.setAttribute('data-label', label);
                        }
                    });
                });
            });
        }

        function ensureAlpineRuntime() {
            if (window.Alpine) {
                hydrateMobileTableLabels();
                return;
            }

            const fallbackScript = document.createElement('script');
            fallbackScript.defer = true;
            fallbackScript.src = 'https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js';
            fallbackScript.onload = () => {
                hydrateMobileTableLabels();
            };
            document.head.appendChild(fallbackScript);
        }

        if (document.readyState === 'complete') {
            ensureAlpineRuntime();
        } else {
            window.addEventListener('load', ensureAlpineRuntime, { once: true });
        }
    })();
    </script>`;
}

const modalMaxWidthMap: Record<string, string> = {
    sm: "24rem",
    md: "28rem",
    lg: "32rem",
    xl: "36rem",
    "2xl": "42rem",
    "4xl": "56rem",
};

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function badgeClassByVariant(variant: string): string {
    const variantClass =
        variant === "success"
            ? "bg-emerald-100 text-emerald-700"
            : variant === "warning"
              ? "bg-amber-100 text-amber-700"
              : variant === "danger"
                ? "bg-red-100 text-red-700"
                : variant === "primary"
                  ? "bg-moka-soft text-moka-primary border border-moka-line"
                  : "bg-[#252525] text-moka-muted border border-moka-line";

    return `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variantClass}`;
}

function transformBadgeTag(template: string): string {
    return template.replace(/<x-ui\.badge([^>]*)>([\s\S]*?)<\/x-ui\.badge>/g, (_, rawAttrs: string, inner: string) => {
        const variantMatch = rawAttrs.match(/\svariant="([^"]+)"/);
        const classMatch = rawAttrs.match(/\sclass="([^"]+)"/);

        const variant = variantMatch?.[1] ?? "default";
        const classes = `${badgeClassByVariant(variant)} ${classMatch?.[1] ?? ""}`.trim();

        let attrs = rawAttrs
            .replace(/\svariant="[^"]+"/, "")
            .replace(/\sclass="[^"]+"/, "")
            .trim();

        if (attrs !== "") {
            attrs = ` ${attrs}`;
        }

        return `<span class="${classes}"${attrs}>${inner}</span>`;
    });
}

function transformModalTag(template: string): string {
    let transformed = template.replace(/<x-ui\.modal\s+name="([^"]+)"(?:\s+maxWidth="([^"]+)")?\s*>/g, (_, name: string, maxWidth: string) => {
        const maxWidthValue = modalMaxWidthMap[maxWidth ?? "2xl"] ?? modalMaxWidthMap["2xl"];

        return `<template x-teleport="body">
    <div x-cloak x-show="${name}" x-on:keydown.escape.window="${name} = false" class="fixed inset-0 z-[120]">
        <div x-show="${name}" x-transition.opacity.duration.200ms x-on:click="${name} = false" class="absolute inset-0 moka-modal-overlay backdrop-blur-sm"></div>
        <div x-show="${name}" x-transition.opacity.duration.200ms class="moka-modal-shell absolute w-[calc(100vw-2rem)] overflow-hidden" style="left: 50%; top: 50%; transform: translate(-50%, -50%); max-width: ${maxWidthValue};">`;
    });

    transformed = transformed.replace(/<\/x-ui\.modal>/g, "</div></div></template>");
    return transformed;
}

function stripLeadingPhpBlock(template: string): string {
    return template.replace(/^\s*@php[\s\S]*?@endphp\s*/m, "");
}

function resolveUnlessBlocks(template: string, isWaiter: boolean): string {
    const startToken = "@unless($isWaiter)";
    const elseToken = "@else";
    const endToken = "@endunless";

    let output = template;

    while (true) {
        const startIndex = output.indexOf(startToken);
        if (startIndex < 0) {
            break;
        }

        let cursor = startIndex + startToken.length;
        let depth = 1;
        let elseIndex = -1;
        let endIndex = -1;

        while (cursor < output.length) {
            const nextStart = output.indexOf(startToken, cursor);
            const nextElse = output.indexOf(elseToken, cursor);
            const nextEnd = output.indexOf(endToken, cursor);

            const candidates = [nextStart, nextElse, nextEnd].filter((value) => value >= 0);
            if (candidates.length === 0) {
                break;
            }

            const next = Math.min(...candidates);
            if (next === nextStart) {
                depth += 1;
                cursor = next + startToken.length;
                continue;
            }

            if (next === nextEnd) {
                depth -= 1;
                if (depth === 0) {
                    endIndex = next;
                    break;
                }
                cursor = next + endToken.length;
                continue;
            }

            if (next === nextElse && depth === 1 && elseIndex < 0) {
                elseIndex = next;
            }

            cursor = next + elseToken.length;
        }

        if (endIndex < 0) {
            break;
        }

        const truthyPart = output.slice(startIndex + startToken.length, elseIndex >= 0 ? elseIndex : endIndex);
        const falsyPart = elseIndex >= 0 ? output.slice(elseIndex + elseToken.length, endIndex) : "";
        const selected = isWaiter ? falsyPart : truthyPart;

        output = output.slice(0, startIndex) + selected + output.slice(endIndex + endToken.length);
    }

    return output;
}

function stableJson(value: unknown): string {
    return JSON.stringify(value ?? null);
}

function toHtmlAttributeJs(value: unknown): string {
    return escapeHtml(stableJson(value));
}

export function renderPosPage(data: PosTemplateData): string {
    const isWaiter = data.mode === "waiter";
    let html = stripLeadingPhpBlock(loadSourceTemplate());
    const viteAssetTags = `${resolveViteAssetTags()}\n    ${runtimeFallbackScriptTag()}`;

    html = resolveUnlessBlocks(html, isWaiter);
    html = transformModalTag(html);
    html = transformBadgeTag(html);

    const replacements: Array<[string, string]> = [
        ["{{ str_replace('_', '-', app()->getLocale()) }}", "id"],
        ["{{ csrf_token() }}", ""],
        ["{{ config('app.name', 'Moka POS') }}", APP_NAME],
        ["{{ asset('logo.png') }}", "/logo.png"],
        ["{{ route('logout') }}", "/logout"],
        ["{{ route('profile.edit') }}", "/profile"],
        ["{{ auth()->user()->name }}", escapeHtml(data.user.name)],
        ["{{ $isWaiter ? 'Waiter' : 'POS Kasir' }}", isWaiter ? "Waiter" : "POS Kasir"],
        ["{{ $isWaiter ? 'Waiter Online' : 'Kasir Online' }}", isWaiter ? "Waiter Online" : "Kasir Online"],
        ["{{ $isWaiter ? route('waiter.history') : route('pos.history') }}", isWaiter ? "/waiter/history" : "/pos/history"],
        ["{{ $isWaiter ? 'Riwayat Pesanan' : 'Riwayat Hari Ini' }}", isWaiter ? "Riwayat Pesanan" : "Riwayat Hari Ini"],
        ["{{ Illuminate\\Support\\Js::from($categoryPayload) }}", toHtmlAttributeJs(data.payload.categories)],
        ["{{ Illuminate\\Support\\Js::from($productPayload) }}", toHtmlAttributeJs(data.payload.products)],
        ["{{ Illuminate\\Support\\Js::from($addonPayload) }}", toHtmlAttributeJs(data.payload.addons)],
        ["{{ Illuminate\\Support\\Js::from($paymentPayload) }}", toHtmlAttributeJs(data.payload.paymentMethods)],
        ["{{ Illuminate\\Support\\Js::from($openBillPayload) }}", toHtmlAttributeJs(data.payload.openBills)],
        ["{{ Illuminate\\Support\\Js::from($resumeOpenBill) }}", toHtmlAttributeJs(data.payload.resumeOpenBill)],
        ["{{ Illuminate\\Support\\Js::from($waiterOrderPayload) }}", toHtmlAttributeJs(data.payload.waiterOrders)],
        ["{{ Illuminate\\Support\\Js::from($resumeWaiterOrder) }}", toHtmlAttributeJs(data.payload.resumeWaiterOrder)],
        ["@js($mode)", toHtmlAttributeJs(data.mode)],
        ["@js($isWaiter ? route('waiter.orders.store') : null)", toHtmlAttributeJs(isWaiter ? "/waiter/orders" : null)],
        ["@js(route('pos.checkout'))", toHtmlAttributeJs("/pos/checkout")],
        ["@js(route('pos.open-bill.save'))", toHtmlAttributeJs("/pos/open-bill")],
        ["@js($isWaiter ? route('waiter.history') : route('pos.history'))", toHtmlAttributeJs(isWaiter ? "/waiter/history" : "/pos/history")],
        ["@js(route('pos.index'))", toHtmlAttributeJs("/pos")],
        ["@js($isWaiter ? null : route('pos.waiter-orders'))", toHtmlAttributeJs(isWaiter ? null : "/pos/waiter-orders")],
        ["@csrf", ""],
        ["@vite(['resources/css/app.css', 'resources/js/app.js'])", viteAssetTags],
    ];

    for (const [search, replace] of replacements) {
        html = html.split(search).join(replace);
    }

    return html;
}
