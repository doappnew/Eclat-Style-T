import { z } from 'zod';

const txt = (max) => z.string().trim().max(max);
export const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    qty: z.number().int().min(1, 'Quantité invalide.').max(20, 'Quantité maximale : 20 par article.'),
    variant: txt(80).optional().nullable(),
  })).min(1, 'Votre panier est vide.').max(30, 'Votre panier contient trop d\'articles.'),
  zoneId: z.string().uuid('Choisissez une zone de livraison.'),
  shipping: z.object({
    full_name: txt(120).min(2, 'Indiquez le nom du destinataire.'),
    phone: txt(30).regex(/^[+0-9 ()-]{6,30}$/, 'Téléphone invalide.'),
    commune: txt(120).min(1, 'Indiquez la commune.'),
    quartier: txt(120).min(1, 'Indiquez le quartier.'),
    address: txt(300).min(3, 'Indiquez une adresse de livraison (3 caractères minimum).'),
    instructions: txt(500).optional().default(''),
    recipient_name: txt(120).optional().default(''),
  }),
});

export const productSchema = z.object({
  name: txt(160).min(2, 'Indiquez le nom du produit.'),
  description: txt(4000).default(''),
  category_id: z.string().uuid('Choisissez une catégorie.'),
  price_pi: z.number({ invalid_type_error: 'Prix invalide.' }).positive('Le prix doit être supérieur à 0.').max(1e9),
  promo_price_pi: z.number().positive().max(1e9).nullable().optional(),
  images: z.array(z.string().max(500).regex(/^(https:\/\/|\/)/, 'URL https requise')).max(8).default([]),
  stock: z.number({ invalid_type_error: 'Stock invalide.' }).int('Le stock doit être un nombre entier.').min(0, 'Le stock ne peut pas être négatif.').max(1e6),
  active: z.boolean().default(true),
  is_new: z.boolean().default(false),
  variants: z.array(z.object({ name: txt(40), options: z.array(txt(40)).max(30) })).max(5).default([]),
});

export const zoneSchema = z.object({
  country: txt(80).min(2, 'Indiquez le pays.'),
  city: txt(80).min(1, 'Indiquez la ville.'),
  fee_pi: z.number({ invalid_type_error: 'Frais invalides.' }).min(0, 'Les frais ne peuvent pas être négatifs.').max(1e6),
  eta: txt(60).default(''),
  active: z.boolean().default(true),
});

export const orderPatchSchema = z.object({
  status: z.enum(['preparing', 'shipping', 'delivered', 'cancelled', 'refunded']).optional(),
  tracking_number: txt(80).optional(),
  admin_comment: txt(1000).optional(),
  eta_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});
