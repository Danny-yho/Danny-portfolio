const { z } = require('zod');

const slug = z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const product = z.object({
  categoryId: z.number().int().positive().nullable().default(null),
  name: z.string().trim().min(2).max(160),
  slug,
  description: z.string().max(5000).default(''),
  price: z.number().int().nonnegative(),
  compareAtPrice: z.number().int().nonnegative().nullable().default(null),
  imageUrl: z.string().max(1000).default(''),
  sizes: z.array(z.string().trim().min(1).max(20)).max(20).default([]),
  colors: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  stock: z.number().int().nonnegative().default(0),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  bestSeller: z.boolean().default(false)
}).superRefine((value, context) => {
  if (value.compareAtPrice !== undefined && value.compareAtPrice !== null && value.compareAtPrice < value.price) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['compareAtPrice'], message: 'Must be at least the current price' });
  }
});

module.exports = {
  login: z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) }),
  product,
  category: z.object({
    name: z.string().trim().min(2).max(100),
    slug,
    description: z.string().max(1000).default('')
  }),
  order: z.object({
    customer: z.object({
      fullName: z.string().trim().min(2).max(120),
      email: z.string().email().max(254),
      phone: z.string().trim().min(7).max(30),
      address: z.string().trim().min(5).max(1000),
      state: z.string().trim().min(2).max(50).optional().default(''),
      notes: z.string().trim().max(2000).optional().default('')
    }),
    items: z.array(z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().min(1).max(50),
      size: z.string().trim().max(20).optional().default(''),
      color: z.string().trim().max(40).optional().default('')
    })).min(1).max(25).refine((items) => {
      const variants = items.map((item) => `${item.productId}:${item.size}:${item.color}`);
      return new Set(variants).size === variants.length;
    }, {
      message: 'Each product size and color combination may only appear once'
    }),
    paymentMethod: z.enum(['paystack', 'whatsapp', 'bank']).default('bank')
  }),
  contact: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().email().max(254),
    subject: z.string().trim().max(180).optional().default('Website enquiry'),
    message: z.string().trim().min(10).max(5000)
  }),
  newsletter: z.object({ email: z.string().email().max(254) }),
  trackingCode: z.object({ trackingCode: z.string().regex(/^[A-F0-9]{18}$/) }),
  paymentVerification: z.object({
    trackingCode: z.string().regex(/^[A-F0-9]{18}$/),
    reference: z.string().trim().min(5).max(200)
  }),
  orderStatus: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
  }),
  settings: z.record(z.union([z.string().max(1000), z.number().finite()]))
};
