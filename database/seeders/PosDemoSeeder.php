<?php

namespace Database\Seeders;

use App\Models\Addon;
use App\Models\Category;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class PosDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@coffeeshop.test'],
            [
                'name' => 'Admin Bar',
                'password' => Hash::make('password'),
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => now(),
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'manager@coffeeshop.test'],
            [
                'name' => 'Manager Bar',
                'password' => Hash::make('password'),
                'role' => User::ROLE_MANAGER,
                'email_verified_at' => now(),
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'kasir@coffeeshop.test'],
            [
                'name' => 'Kasir Bar',
                'password' => Hash::make('password'),
                'role' => User::ROLE_KASIR,
                'email_verified_at' => now(),
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'waiter1@coffeeshop.test'],
            [
                'name' => 'Waiter 1',
                'password' => Hash::make('password'),
                'role' => User::ROLE_WAITER,
                'email_verified_at' => now(),
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'waiter2@coffeeshop.test'],
            [
                'name' => 'Waiter 2',
                'password' => Hash::make('password'),
                'role' => User::ROLE_WAITER,
                'email_verified_at' => now(),
            ]
        );

        $catalog = $this->loadProductCatalog();

        DB::transaction(function () use ($catalog): void {
            Addon::query()->update(['is_active' => false]);
            Category::query()->update(['is_active' => false]);
            Product::query()->update(['is_active' => false]);

            /** @var array<string, int> $categoryMap */
            $categoryMap = [];
            foreach ($catalog['categories'] as $categoryName) {
                $category = Category::query()->updateOrCreate(
                    ['name' => $categoryName],
                    ['is_active' => true]
                );

                $categoryMap[$categoryName] = $category->id;
            }

            $publicImages = $this->buildPublicImageMap();
            $importedSkus = [];

            foreach ($catalog['products'] as $row) {
                $sku = strtoupper(trim((string) ($row['sku'] ?? '')));
                $name = trim((string) ($row['name'] ?? ''));
                $categoryName = trim((string) ($row['category'] ?? ''));

                if ($sku === '' || $name === '') {
                    continue;
                }

                if (! isset($categoryMap[$categoryName])) {
                    $category = Category::query()->updateOrCreate(
                        ['name' => $categoryName !== '' ? $categoryName : 'Lainnya'],
                        ['is_active' => true]
                    );

                    $categoryMap[$category->name] = $category->id;
                    $categoryName = $category->name;
                }

                $product = Product::query()->firstOrNew(['sku' => $sku]);
                if (! $product->exists) {
                    $product->image_path = null;
                }

                $resolvedImagePath = $this->resolveProductImagePath($name, $publicImages);

                $product->fill([
                    'name' => $name,
                    'category_id' => $categoryMap[$categoryName],
                    'price' => max(0, (float) ($row['price'] ?? 0)),
                    'cost_price' => max(0, (float) ($row['cost_price'] ?? 0)),
                    'track_stock' => true,
                    'stock_qty' => max(0, (int) ($row['stock_qty'] ?? 0)),
                    'is_active' => true,
                    'image_path' => $resolvedImagePath ?? $product->image_path,
                ]);
                $product->save();

                $product->variants()->delete();
                $importedSkus[] = $sku;
            }

            if ($importedSkus !== []) {
                Product::query()
                    ->whereNotIn('sku', $importedSkus)
                    ->update(['is_active' => false]);
            }

            $importedCategoryNames = array_keys($categoryMap);
            if ($importedCategoryNames !== []) {
                Category::query()
                    ->whereNotIn('name', $importedCategoryNames)
                    ->update(['is_active' => false]);
            }
        });

        $methods = [
            ['name' => 'Cash', 'code' => 'cash'],
            ['name' => 'QRIS', 'code' => 'qris'],
            ['name' => 'Debit', 'code' => 'debit'],
            ['name' => 'E-Wallet', 'code' => 'ewallet'],
        ];

        foreach ($methods as $method) {
            PaymentMethod::query()->updateOrCreate(
                ['code' => $method['code']],
                [
                    'name' => $method['name'],
                    'is_active' => true,
                ]
            );
        }
    }

    /**
     * @return array<string, array{basename: string, path: string}>
     */
    private function buildPublicImageMap(): array
    {
        $pattern = base_path('public').DIRECTORY_SEPARATOR.'*.{png,jpg,jpeg,webp,svg}';
        $files = glob($pattern, GLOB_BRACE) ?: [];

        $map = [];

        foreach ($files as $filePath) {
            $basename = basename($filePath);
            $nameOnly = pathinfo($basename, PATHINFO_FILENAME);
            $key = $this->normalizeKey($nameOnly);

            if ($key === '') {
                continue;
            }

            $map[$key] = [
                'basename' => $basename,
                'path' => $filePath,
            ];
        }

        return $map;
    }

    /**
     * @param array<string, array{basename: string, path: string}> $publicImages
     */
    private function resolveProductImagePath(string $productName, array $publicImages): ?string
    {
        $productKey = $this->normalizeKey($productName);

        $aliases = [
            'absolutevodka' => 'absolutvodka',
            'blueilusionpitcher' => 'blueilusionbypitcher',
            'flaming' => 'flamming',
            'hennessyvsop' => 'hennesyvsop',
            'kratingdaeng' => 'krantingdaeng',
            'marlboroiceburst' => 'malboroiceburst',
            'paketkawa3botol' => 'paketkawakawa3botol',
            'pokagreentea' => 'pokkagreentea',
        ];

        $lookupKey = $aliases[$productKey] ?? $productKey;

        if (! isset($publicImages[$lookupKey])) {
            return null;
        }

        $source = $publicImages[$lookupKey];
        $relativePath = 'products/'.$source['basename'];

        $binary = file_get_contents($source['path']);
        if ($binary === false) {
            return null;
        }

        Storage::disk('public')->put($relativePath, $binary);

        return $relativePath;
    }

    private function normalizeKey(string $value): string
    {
        $value = mb_strtolower($value, 'UTF-8');
        $value = preg_replace('/[^a-z0-9]+/u', '', $value) ?? '';

        return $value;
    }

    /**
     * @return array{categories: array<int, string>, products: array<int, array<string, mixed>>}
     */
    private function loadProductCatalog(): array
    {
        $file = database_path('data/product_catalog.php');
        if (! file_exists($file)) {
            throw new \RuntimeException('File katalog produk tidak ditemukan: '.$file);
        }

        /** @var mixed $catalog */
        $catalog = require $file;
        if (! is_array($catalog)) {
            throw new \RuntimeException('Format file katalog produk tidak valid.');
        }

        $categories = array_values(array_filter(
            array_map(static fn ($item) => trim((string) $item), $catalog['categories'] ?? []),
            static fn ($item) => $item !== ''
        ));

        $products = array_values(array_filter(
            $catalog['products'] ?? [],
            static fn ($row) => is_array($row)
                && trim((string) ($row['name'] ?? '')) !== ''
                && trim((string) ($row['sku'] ?? '')) !== ''
        ));

        if ($products === []) {
            throw new \RuntimeException('Data produk kosong di katalog.');
        }

        return [
            'categories' => $categories,
            'products' => $products,
        ];
    }
}
