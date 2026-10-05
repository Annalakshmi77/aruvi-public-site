const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ||
  'https://platform-backend-ipi4.onrender.com';



export interface PublicCategory {
  id: string;
  name: string;
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
  description?: string;
  image?: string;
  price: number | null;
  stock: string | number | null;
  status: string;
}

export interface PublicProduct {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  category: string;
  price: number | null;
  priceNote?: string;
  stock: number | null;
  stockNote?: string;
  stockStatus?: string;
  moq?: number;
  image?: string;
  description?: string;
  gallery?: { id: number; label: string; src: string }[];
  variants?: PublicVariant[];
}

export interface CatalogQueryParams {
  search?: string;
  categoryId?: string;
  categoryIds?: string[];
  priceMin?: number;
  priceMax?: number;
  status?: string;
  sortBy?: 'createdAt' | 'price' | 'name' | 'stock';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
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

export const catalogService = {
  /**
   * Fetch public categories from POST /public/categories
   */
  async getCategories(options: { search?: string; limit?: number } = {}): Promise<PublicCategory[]> {
    const res = await fetch(`${API_BASE_URL}/public/categories`, {
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
    return json.data?.categories || [];
  },

  /**
   * Fetch public products from POST /public/products
   */
  async getProducts(params: CatalogQueryParams = {}): Promise<CatalogResponse> {
    const res = await fetch(`${API_BASE_URL}/public/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 50,
        ...params,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || { products: [], total: 0, page: 1, limit: 50, totalPages: 0 };
  },
};
