export type ProductStatus = "active" | "hidden";

export type ProductOption = {
  label: string;
  price: number;
};

export type Product = {
  id: string;
  section: string;
  name: string;
  details: string[];
  options: ProductOption[];
  imageSrc?: string;
  imageAlt?: string;
  stock: number;
  status: ProductStatus;
  updatedAt: string;
};

