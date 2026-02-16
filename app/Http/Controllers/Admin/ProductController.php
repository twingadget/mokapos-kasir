<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\View\View;

class ProductController extends Controller
{
    public function index(Request $request): View
    {
        $search = trim((string) $request->query('q', ''));

        $perPage = (string) $request->query('per_page', '10');
        $allowedPerPage = ['10', '15', '25', '50', '100', 'all'];

        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = '10';
        }

        $productsQuery = Product::query()
            ->where('is_active', true)
            ->with(['category:id,name', 'variants' => fn ($query) => $query->orderBy('name')])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($searchQuery) use ($search): void {
                    $searchQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhereRaw('CAST(price AS CHAR) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('CAST(cost_price AS CHAR) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('CAST(stock_qty AS CHAR) LIKE ?', ["%{$search}%"])
                        ->orWhereHas('category', function ($categoryQuery) use ($search): void {
                            $categoryQuery->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('variants', function ($variantQuery) use ($search): void {
                            $variantQuery->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('name');

        if ($perPage === 'all') {
            $totalRows = (clone $productsQuery)->count();
            $products = $productsQuery
                ->paginate(max($totalRows, 1))
                ->withQueryString();
        } else {
            $products = $productsQuery
                ->paginate((int) $perPage)
                ->withQueryString();
        }

        return view('admin.products.index', [
            'products' => $products,
            'perPage' => $perPage,
            'search' => $search,
        ]);
    }

    public function create(): View
    {
        $categories = Category::query()->active()->orderBy('name')->get();

        return view('admin.products.create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePayload($request);

        DB::transaction(function () use ($request, $validated) {
            $product = Product::query()->create([
                'name' => $validated['name'],
                'sku' => strtoupper($validated['sku']),
                'category_id' => $validated['category_id'],
                'price' => $validated['price'],
                'cost_price' => $validated['cost_price'],
                'is_active' => $request->boolean('is_active'),
                'track_stock' => $request->boolean('track_stock'),
                'stock_qty' => $request->boolean('track_stock') ? (int) ($validated['stock_qty'] ?? 0) : 0,
                'image_path' => $this->storeImageIfAny($request),
            ]);

            $this->syncVariants($product, $validated['variants'] ?? []);
        });

        return redirect()->route('admin.products.index')->with('success', 'Berhasil menyimpan produk.');
    }

    public function edit(Product $product): View
    {
        $product->load('variants');

        $categories = Category::query()->active()->orderBy('name')->get();

        return view('admin.products.edit', [
            'product' => $product,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $this->validatePayload($request, $product);

        DB::transaction(function () use ($request, $validated, $product) {
            $newImagePath = $this->storeImageIfAny($request);

            if ($newImagePath && $product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }

            $product->update([
                'name' => $validated['name'],
                'sku' => strtoupper($validated['sku']),
                'category_id' => $validated['category_id'],
                'price' => $validated['price'],
                'cost_price' => $validated['cost_price'],
                'is_active' => $request->boolean('is_active'),
                'track_stock' => $request->boolean('track_stock'),
                'stock_qty' => $request->boolean('track_stock') ? (int) ($validated['stock_qty'] ?? 0) : 0,
                'image_path' => $newImagePath ?: $product->image_path,
            ]);

            $this->syncVariants($product, $validated['variants'] ?? []);
        });

        return redirect()->route('admin.products.index')->with('success', 'Berhasil menyimpan produk.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }

        $product->delete();

        return redirect()->route('admin.products.index')->with('success', 'Produk berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, ?Product $product = null): array
    {
        $skuRule = 'unique:products,sku';
        if ($product) {
            $skuRule .= ','.$product->id;
        }

        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', $skuRule],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'track_stock' => ['nullable', 'boolean'],
            'stock_qty' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:5120'],
            'variants' => ['nullable', 'array'],
            'variants.*.name' => ['nullable', 'string', 'max:100'],
            'variants.*.price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.price_delta' => ['nullable', 'numeric'],
            'variants.*.is_active' => ['nullable'],
        ]);
    }

    private function storeImageIfAny(Request $request): ?string
    {
        if (! $request->hasFile('image')) {
            return null;
        }

        /** @var UploadedFile $image */
        $image = $request->file('image');
        $mimeType = strtolower((string) $image->getMimeType());
        $extension = strtolower((string) $image->getClientOriginalExtension());

        if ($mimeType === 'image/svg+xml' || $extension === 'svg') {
            return $this->storeOptimizedSvg($image);
        }

        return $this->storeOptimizedRasterImage($image);
    }

    private function storeOptimizedSvg(UploadedFile $file): string
    {
        $content = file_get_contents($file->getRealPath());
        if ($content === false) {
            throw new \RuntimeException('Gagal membaca file SVG.');
        }

        $optimized = $this->optimizeSvgString($content);
        $path = 'products/'.Str::ulid().'.svg';

        Storage::disk('public')->put($path, $optimized);

        return $path;
    }

    private function optimizeSvgString(string $svg): string
    {
        $svg = preg_replace('/^\xEF\xBB\xBF/', '', $svg) ?? $svg;
        $svg = preg_replace('/<\?xml[^>]*\?>/i', '', $svg) ?? $svg;
        $svg = preg_replace('/<!DOCTYPE[^>]*>/i', '', $svg) ?? $svg;
        $svg = preg_replace('/<!--.*?-->/s', '', $svg) ?? $svg;
        $svg = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $svg) ?? $svg;
        $svg = preg_replace('/\son\w+="[^"]*"/i', '', $svg) ?? $svg;
        $svg = preg_replace("/\son\w+='[^']*'/i", '', $svg) ?? $svg;
        $svg = preg_replace('/>\s+</', '><', $svg) ?? $svg;
        $svg = preg_replace('/\s{2,}/', ' ', $svg) ?? $svg;

        return trim($svg);
    }

    private function storeOptimizedRasterImage(UploadedFile $file): string
    {
        $sourceImage = $this->createImageResource($file);
        if (! $sourceImage) {
            return $file->store('products', 'public');
        }

        $sourceWidth = imagesx($sourceImage);
        $sourceHeight = imagesy($sourceImage);

        $maxDimension = 1400;
        $scale = min($maxDimension / max(1, $sourceWidth), $maxDimension / max(1, $sourceHeight), 1);
        $targetWidth = max(1, (int) round($sourceWidth * $scale));
        $targetHeight = max(1, (int) round($sourceHeight * $scale));

        $targetImage = imagecreatetruecolor($targetWidth, $targetHeight);
        if (! $targetImage) {
            imagedestroy($sourceImage);

            return $file->store('products', 'public');
        }

        imagealphablending($targetImage, false);
        imagesavealpha($targetImage, true);
        $transparent = imagecolorallocatealpha($targetImage, 0, 0, 0, 127);
        imagefill($targetImage, 0, 0, $transparent);

        imagecopyresampled(
            $targetImage,
            $sourceImage,
            0,
            0,
            0,
            0,
            $targetWidth,
            $targetHeight,
            $sourceWidth,
            $sourceHeight,
        );

        ob_start();
        $encodedAsWebp = function_exists('imagewebp') ? imagewebp($targetImage, null, 82) : false;
        $binary = (string) ob_get_clean();

        if (! $encodedAsWebp || $binary === '') {
            ob_start();
            $encodedAsJpeg = imagejpeg($targetImage, null, 82);
            $binary = (string) ob_get_clean();
            $extension = 'jpg';
            $contentType = 'image/jpeg';

            if (! $encodedAsJpeg || $binary === '') {
                imagedestroy($targetImage);
                imagedestroy($sourceImage);

                return $file->store('products', 'public');
            }
        } else {
            $extension = 'webp';
            $contentType = 'image/webp';
        }

        imagedestroy($targetImage);
        imagedestroy($sourceImage);

        $path = 'products/'.Str::ulid().'.'.$extension;
        Storage::disk('public')->put($path, $binary, ['ContentType' => $contentType]);

        return $path;
    }

    private function createImageResource(UploadedFile $file): mixed
    {
        if (! extension_loaded('gd')) {
            return null;
        }

        $realPath = $file->getRealPath();
        if ($realPath === false) {
            return null;
        }

        $mimeType = strtolower((string) $file->getMimeType());

        return match ($mimeType) {
            'image/jpeg', 'image/jpg' => @imagecreatefromjpeg($realPath),
            'image/png' => @imagecreatefrompng($realPath),
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($realPath) : null,
            default => @imagecreatefromstring((string) file_get_contents($realPath)),
        };
    }

    /**
     * @param array<int, array<string, mixed>> $variantsPayload
     */
    private function syncVariants(Product $product, array $variantsPayload): void
    {
        $product->variants()->delete();

        foreach ($variantsPayload as $variantPayload) {
            $name = trim((string) ($variantPayload['name'] ?? ''));

            if ($name === '') {
                continue;
            }

            $price = $variantPayload['price'] ?? null;
            $priceDelta = $variantPayload['price_delta'] ?? null;

            $product->variants()->create([
                'name' => $name,
                'price' => $price === '' ? null : $price,
                'price_delta' => $priceDelta === '' ? null : $priceDelta,
                'is_active' => array_key_exists('is_active', $variantPayload),
            ]);
        }
    }
}
