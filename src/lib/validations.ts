import { z } from 'zod'

export const transactionSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  category: z.string().min(1, 'Category is required'),
  type: z.enum(['Income', 'Expense']),
  ownership: z.enum(['Personal', 'Joint']),
  accountId: z.string().min(1, 'Account is required'),
})

export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(50, 'Name too long'),
  type: z.enum(['Checking', 'Savings', 'Credit', 'Cash']),
  balance: z.number(),
  isJoint: z.boolean(),
})

export const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit: z.number().positive('Limit must be greater than 0'),
})

export const userSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  avatar: z.string().optional(),
})

export const billSchema = z.object({
  name: z.string().min(1, 'Bill name is required').max(100, 'Name too long'),
  amount: z.number().positive('Amount must be greater than 0'),
  dueDate: z.string().min(1, 'Due date is required'),
  category: z.string().min(1, 'Category is required'),
  isRecurring: z.boolean(),
  frequency: z.enum(['Monthly', 'Quarterly', 'Yearly']).optional(),
  reminder: z.number().int().min(1).max(30),
  notes: z.string().max(500, 'Notes too long').optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Name too long'),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(['Income', 'Expense']),
})

export const transferSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  fromAccountId: z.string().min(1, 'Source account is required'),
  toAccountId: z.string().min(1, 'Destination account is required'),
  description: z.string().max(200, 'Description too long').optional(),
}).refine((data) => data.fromAccountId !== data.toAccountId, {
  message: 'Cannot transfer to the same account',
  path: ['toAccountId'],
})

export const recurringTransactionSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  category: z.string().min(1, 'Category is required'),
  type: z.enum(['Income', 'Expense']),
  ownership: z.enum(['Personal', 'Joint']),
  frequency: z.enum(['Daily', 'Weekly', 'Monthly', 'Yearly']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  accountId: z.string().min(1, 'Account is required'),
})

export type TransactionInput = z.infer<typeof transactionSchema>
export type AccountInput = z.infer<typeof accountSchema>
export type BudgetInput = z.infer<typeof budgetSchema>
export type UserInput = z.infer<typeof userSchema>
export type BillInput = z.infer<typeof billSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type TransferInput = z.infer<typeof transferSchema>
export type RecurringTransactionInput = z.infer<typeof recurringTransactionSchema>

export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors: Record<string, string> = {}
  for (const error of result.error.errors) {
    const path = error.path.join('.')
    errors[path] = error.message
  }
  
  return { success: false, errors }
}
