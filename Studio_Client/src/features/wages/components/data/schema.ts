// schemas/wage.ts
import { z } from 'zod'

// Wage Item schema
export const wageItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unit: z.string(),
  unitPrice: z.number(),
})

// Wage schema
export const wageSchema = z.object({
  _id: z.string().optional(), // ObjectId as string
  wageNumber: z.string(),
  projectId: z.string(), // ObjectId as string
  reference: z.string().optional(),
  company: z.string(),
  status: z.enum(['pending', 'in-transit', 'delivered', 'declined', 'approved']),
  date: z.date(),
  deliveryDate: z.date(),
  deliveryAddress: z.string(),
  notes: z.string().optional(),

  vendorName: z.string(),
  vendorContact: z.string().optional(),
  vendorEmail: z.string().optional(),
  vendorPhone: z.string().optional(),
  vendorAddress: z.string().optional(),

  items: z.array(wageItemSchema),
  amount: z.number().default(0),

  subcontractorId: z.string().optional(),
  estimateId: z.string().optional(),
  estimateLevel: z.enum(['estimate', 'group', 'section', 'subsection']).optional(),
  estimateTargetId: z.string().optional(),

  isDeleted: z.boolean().default(false),
  deletedAt: z.date().nullable().optional(),

  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

// Inferred TypeScript type
export type Wage = z.infer<typeof wageSchema>
