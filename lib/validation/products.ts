import { z } from "zod";

export const productOptionSchema = z.object({
  label: z.string().trim().min(1, "יש להזין שם חבילה"),
  price: z.number().finite().positive("יש להזין מחיר תקין")
});

const productStatusSchema = z.enum(["active", "hidden"]);

export const productCreateSchema = z.object({
  id: z.string().trim().min(1).optional(),
  section: z.string().trim().min(1, "יש להזין קטגוריה"),
  name: z.string().trim().min(1, "יש להזין שם מוצר"),
  details: z.array(z.string().trim().min(1)).default([]),
  options: z.array(productOptionSchema).min(1, "יש להוסיף לפחות חבילה אחת"),
  imageSrc: z.string().trim().optional(),
  imageAlt: z.string().trim().optional(),
  stock: z.number().int().min(0, "מלאי חייב להיות 0 ומעלה").default(0),
  status: productStatusSchema.default("active")
});

export const productUpdateSchema = productCreateSchema.omit({ id: true }).partial();

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

