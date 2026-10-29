/**
 * Product Catalogue Service (Public API v2)
 *
 * Implements the v2 read-only catalogue endpoints:
 * - POST /public/v2/categories
 * - POST /public/v2/filters
 * - POST /public/v2/products
 * - POST /public/v2/products/details
 * - POST /public/v2/availability
 */

const API_BASE_URL =
  (import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ||
  'https://enterprise-platform-backend-dt9e.onrender.com').replace(/\/mcp\/?$/, '');

/**
 * Resolves an asset image path into a full URL if relative
 */
export const getFullImageUrl = (path?: string | null): string | null => {
  if (!path || path.trim() === '') return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

// ============================================================================
// Official V2 API Shapes
// ============================================================================

export type V2AvailabilityStatus = 'available' | 'in_stock' | 'low_stock' | 'out_of_stock';

export interface V2Availability {
  status: V2AvailabilityStatus;
  text: string;
  quantity?: number;
}

export interface V2ProductItem {
  item_id: string;
  sku: string;
  label?: string;
  price_minor: number | null;
  price_text: string | null;
  price_note?: string;
  availability: V2Availability;
  options?: Record<string, string>;
  mrp_text?: string;
  saving_text?: string;
  tax_text?: string;
  price_per_unit_text?: string;
  pack_text?: string;
  limits_text?: string;
  image?: string | null;
}

export interface V2ProductCard {
  id: string;
  name: string;
  brand?: string | null;
  category: string | null;
  price_minor: number | null;
  price_text: string | null;
  price_note?: string;
  availability: V2Availability;
  options?: Record<string, string[]>;
  items: V2ProductItem[];
  more_items?: number;
  items_note?: string;
  bundle?: boolean;
  image: string | null;
}

export interface V2ProductDetail {
  id: string;
  name: string;
  brand?: string | null;
  description?: string;
  categories: string[];
  attributes: { name: string; value: string }[];
  variant_options: string[];
  fulfilment: string;
  availability: V2Availability;
  items: V2ProductItem[];
  images: string[];
  bundle_contents?: string[];
  delivery?: string;
}

export interface V2Category {
  id: string;
  name: string;
  path: string;
  products: number;
}

export interface V2FilterOption {
  value: string;
  label: string;
  products?: number;
}

export interface V2Filter {
  key: string;
  name: string;
  type: 'enum' | 'number' | 'boolean' | string;
  size?: boolean;
  unit_family?: string;
  example?: string;
  options?: V2FilterOption[];
}

export interface V2FiltersResponse {
  filters: V2Filter[];
  sorts: string[];
  products_in_scope: number;
  how_to_use?: string;
}

export interface V2ProductDetailsResponse {
  products: V2ProductDetail[];
  requested: number;
  returned: number;
  missing: string[];
  message?: string;
}

export interface V2AvailabilityResponse {
  items: {
    item_id: string;
    sku?: string;
    product_id?: string;
    availability: V2Availability;
  }[];
  missing: string[];
}

export interface V2SearchProductsParams {
  search?: string;
  category_id?: string;
  filters?: Record<string, (string | number)[]>;
  price_min?: number;
  price_max?: number;
  in_stock_only?: boolean;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'name' | 'size_asc' | 'size_desc';
  page?: number;
  limit?: number;
  language?: 'en' | 'ta' | 'hi';
}

// ============================================================================
// UI Compatibility Interfaces
// ============================================================================

export interface PublicCategory {
  id: string;
  name: string;
  path?: string;
  description?: string;
  productsCount?: number;
  icon?: string;
  color?: string;
}

export interface PublicVariant {
  variantId?: string;
  sku?: string;
  attributes: { name: string; value: string }[];
  option: string;
  value: string;
  label?: string;
  description?: string;
  image?: string | null;
  price: number | null;
  priceText?: string | null;
  priceNote?: string;
  moq?: number | null;
  stock: string | number | null;
  status: string;
}

export interface PublicProduct {
  id: string;
  name: string;
  brand?: string | null;
  sku: string;
  categoryId?: string;
  category: string;
  price: number | null;
  priceText?: string | null;
  priceNote?: string;
  stock: number | null;
  stockNote?: string;
  stockStatus?: string;
  moq?: number;
  image?: string | null;
  description?: string;
  gallery?: { id: number; label: string; src: string }[];
  variantCount?: number;
  variants: PublicVariant[];
}

export interface CatalogQueryParams extends V2SearchProductsParams {
  categoryId?: string;
  categoryIds?: string[];
  priceMin?: number;
  priceMax?: number;
  status?: string;
  sortBy?: 'createdAt' | 'price' | 'name' | 'stock';
  sortOrder?: 'asc' | 'desc';
}

export interface CatalogResponse {
  products: PublicProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CategoriesResponse {
  categories: PublicCategory[];
  total: number;
}

// ============================================================================
// Helpers: Parse MOQ and Map V2 Shapes to Client Shapes
// ============================================================================

const parseMoqFromLimitsText = (limitsText?: string): number => {
  if (!limitsText) return 1;
  const match = limitsText.match(/min\s*([0-9]+)/i);
  return match ? parseInt(match[1], 10) : 1;
};

/**
 * Converts a V2ProductItem into a PublicVariant
 */
const mapV2ItemToPublicVariant = (
  item: V2ProductItem,
  productLevelAttributes: { name: string; value: string }[] = [],
  fallbackMoq: number = 1
): PublicVariant => {
  const itemAttrs: { name: string; value: string }[] = [];

  if (item.options && typeof item.options === 'object') {
    for (const [name, value] of Object.entries(item.options)) {
      itemAttrs.push({ name, value: String(value) });
    }
  }

  // Combine product-level attributes (e.g. Pieces per box) with item attributes
  for (const attr of productLevelAttributes) {
    if (!itemAttrs.some((a) => a.name.toLowerCase() === attr.name.toLowerCase())) {
      itemAttrs.push(attr);
    }
  }

  const optionName = itemAttrs[0]?.name || 'Option';
  const optionValue = itemAttrs[0]?.value || item.label || 'Standard';

  const price = typeof item.price_minor === 'number' ? item.price_minor / 100 : null;
  const moq = item.limits_text ? parseMoqFromLimitsText(item.limits_text) : fallbackMoq;

  let stock: string | number | null = null;
  if (typeof item.availability?.quantity === 'number') {
    stock = item.availability.quantity;
  } else if (item.availability?.status === 'out_of_stock') {
    stock = 0;
  }

  return {
    variantId: item.item_id,
    sku: item.sku,
    attributes: itemAttrs,
    option: optionName,
    value: optionValue,
    label: item.label,
    description: item.label,
    image: getFullImageUrl(item.image),
    price,
    priceText: item.price_text,
    priceNote: item.price_note,
    moq,
    stock,
    status: item.availability?.text || item.availability?.status || 'Active',
  };
};

/**
 * Maps a V2 Product Card to a PublicProduct
 */
const mapV2CardToPublicProduct = (card: V2ProductCard): PublicProduct => {
  const price = typeof card.price_minor === 'number' ? card.price_minor / 100 : null;
  const primarySku = card.items?.[0]?.sku || card.id;

  // Build variants from card items
  let variants: PublicVariant[] = (card.items || []).map((item) =>
    mapV2ItemToPublicVariant(item, [], 1)
  );

  // If card has options dictionary (e.g. { "Tape Size": ["1 inch"], "Tape Colors": ["Red", "Blue"] })
  // but only 3 items are returned, we ensure variant attributes reflect all color/size options
  if (card.options && typeof card.options === 'object') {
    // Collect all option names
    const optionKeys = Object.keys(card.options);
    const sizeKey = optionKeys.find((k) => /size|width/i.test(k));
    const colorKey = optionKeys.find((k) => /color|colour/i.test(k));

    const allSizes = sizeKey ? card.options[sizeKey] : [];
    const allColors = colorKey ? card.options[colorKey] : [];

    // If variants list is empty or sparse, populate placeholder variants so UI filters display all choices
    if (variants.length === 0 && (allSizes.length > 0 || allColors.length > 0)) {
      const sizes = allSizes.length > 0 ? allSizes : ['Standard'];
      const colors = allColors.length > 0 ? allColors : ['Standard'];

      variants = [];
      sizes.forEach((s) => {
        colors.forEach((c) => {
          variants.push({
            variantId: `${card.id}-${s}-${c}`,
            sku: `${primarySku}-${s}-${c}`.replace(/\s+/g, '-').toUpperCase(),
            attributes: [
              ...(sizeKey ? [{ name: sizeKey, value: s }] : []),
              ...(colorKey ? [{ name: colorKey, value: c }] : []),
            ],
            option: sizeKey || 'Size',
            value: s,
            image: getFullImageUrl(card.image),
            price,
            priceText: card.price_text,
            priceNote: card.price_note,
            moq: 1,
            stock: null,
            status: card.availability?.text || 'Available',
          });
        });
      });
    }
  }

  const variantCount = (card.items?.length || 0) + (card.more_items || 0);
  const variantWithImage = card.items?.find((item) => item.image && item.image.trim() !== '');
  const resolvedCardImage = getFullImageUrl(card.image || variantWithImage?.image);

  return {
    id: card.id,
    name: card.name,
    brand: card.brand,
    sku: primarySku,
    category: card.category || 'General',
    price,
    priceText: card.price_text,
    priceNote: card.price_note,
    stock: typeof card.availability?.quantity === 'number' ? card.availability.quantity : null,
    stockStatus: card.availability?.status,
    stockNote: card.availability?.text,
    moq: 1,
    image: resolvedCardImage,
    variantCount: Math.max(variantCount, variants.length),
    variants,
  };
};

/**
 * Maps full V2 Product Detail to PublicProduct
 */
const mapV2DetailToPublicProduct = (detail: V2ProductDetail): PublicProduct => {
  const primarySku = detail.items?.[0]?.sku || detail.id;
  const category = detail.categories?.[0] || 'General';

  const defaultItem = detail.items?.[0];
  const price =
    typeof defaultItem?.price_minor === 'number' ? defaultItem.price_minor / 100 : null;

  const moq = defaultItem?.limits_text
    ? parseMoqFromLimitsText(defaultItem.limits_text)
    : 1;

  const variants: PublicVariant[] = (detail.items || []).map((item) =>
    mapV2ItemToPublicVariant(item, detail.attributes || [], moq)
  );

  const gallery = (detail.images || []).map((img, idx) => ({
    id: idx + 1,
    label: detail.name,
    src: getFullImageUrl(img) || img,
  }));

  const variantWithImage = detail.items?.find((item) => item.image && item.image.trim() !== '');
  const primaryImage =
    gallery[0]?.src || getFullImageUrl(defaultItem?.image) || getFullImageUrl(variantWithImage?.image) || null;

  return {
    id: detail.id,
    name: detail.name,
    brand: detail.brand,
    sku: primarySku,
    category,
    price,
    priceText: defaultItem?.price_text || null,
    priceNote: defaultItem?.price_note,
    stock:
      typeof detail.availability?.quantity === 'number'
        ? detail.availability.quantity
        : null,
    stockStatus: detail.availability?.status,
    stockNote: detail.availability?.text,
    moq,
    image: primaryImage,
    description: detail.description,
    gallery,
    variantCount: variants.length,
    variants,
  };
};

// ============================================================================
// Service Implementation
// ============================================================================

export const catalogService = {
  /**
   * Fetch public categories from POST /public/v2/categories
   */
  async getCategories(options: { search?: string; language?: 'en' | 'ta' | 'hi' } = {}): Promise<PublicCategory[]> {
    const res = await fetch(`${API_BASE_URL}/public/v2/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.statusText}`);
    }

    const json = await res.json();
    const categories: V2Category[] = json.data?.categories || [];

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      path: cat.path,
      description: cat.path,
      productsCount: cat.products,
    }));
  },

  /**
   * Fetch filter options from POST /public/v2/filters
   */
  async getFilters(options: { category_id?: string; language?: 'en' | 'ta' | 'hi' } = {}): Promise<V2FiltersResponse> {
    const res = await fetch(`${API_BASE_URL}/public/v2/filters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch filters: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || { filters: [], sorts: [], products_in_scope: 0 };
  },

  /**
   * Search / Browse products from POST /public/v2/products
   */
  async getProducts(params: CatalogQueryParams = {}): Promise<CatalogResponse> {
    // Map legacy / UI params into V2 body format
    const v2Body: V2SearchProductsParams = {
      search: params.search,
      category_id: params.category_id || params.categoryId,
      filters: params.filters,
      price_min: params.price_min ?? params.priceMin,
      price_max: params.price_max ?? params.priceMax,
      in_stock_only: params.in_stock_only ?? (params.status === 'in_stock'),
      page: params.page || 1,
      limit: params.limit || 50,
      language: params.language || 'en',
    };

    // Sort mapping
    if (params.sort) {
      v2Body.sort = params.sort;
    } else if (params.sortBy) {
      if (params.sortBy === 'price') {
        v2Body.sort = params.sortOrder === 'desc' ? 'price_desc' : 'price_asc';
      } else if (params.sortBy === 'name') {
        v2Body.sort = 'name';
      } else {
        v2Body.sort = 'newest';
      }
    }

    const res = await fetch(`${API_BASE_URL}/public/v2/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(v2Body),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.statusText}`);
    }

    const json = await res.json();
    const rawCards: V2ProductCard[] = json.data?.products || [];
    const mappedProducts: PublicProduct[] = rawCards.map(mapV2CardToPublicProduct);

    return {
      products: mappedProducts,
      total: json.data?.total ?? mappedProducts.length,
      page: json.data?.page ?? 1,
      limit: v2Body.limit || 50,
      totalPages: json.data?.pages ?? 1,
    };
  },

  /**
   * Fetch full product details for up to 20 IDs from POST /public/v2/products/details
   */
  async getProductDetails(ids: string[], language: 'en' | 'ta' | 'hi' = 'en'): Promise<V2ProductDetailsResponse> {
    if (!ids || ids.length === 0) {
      return { products: [], requested: 0, returned: 0, missing: [] };
    }

    const res = await fetch(`${API_BASE_URL}/public/v2/products/details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: ids.slice(0, 20), language }),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch product details: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || { products: [], requested: ids.length, returned: 0, missing: ids };
  },

  /**
   * Helper: Fetch and map a single product with complete variants and attributes
   */
  async getProductFull(id: string, language: 'en' | 'ta' | 'hi' = 'en'): Promise<PublicProduct | null> {
    const details = await this.getProductDetails([id], language);
    const detail = details.products?.find((p) => p.id === id);
    if (!detail) return null;
    return mapV2DetailToPublicProduct(detail);
  },

  /**
   * Check live stock for item/variant IDs from POST /public/v2/availability
   */
  async checkAvailability(itemIds: string[]): Promise<V2AvailabilityResponse> {
    if (!itemIds || itemIds.length === 0) {
      return { items: [], missing: [] };
    }

    const res = await fetch(`${API_BASE_URL}/public/v2/availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ item_ids: itemIds.slice(0, 50) }),
    });

    if (!res.ok) {
      throw new Error(`Failed to check availability: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || { items: [], missing: itemIds };
  },
};
