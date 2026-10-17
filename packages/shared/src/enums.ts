import { z } from 'zod';

export const RoleSchema = z.enum([
  'OWNER',
  'TECHNOLOGIST',
  'FOREMAN',
  'CUTTER',
  'SEWER',
  'STOREKEEPER',
  'ACCOUNTANT',
  'CLIENT',
]);
export type Role = z.infer<typeof RoleSchema>;
export const Role = RoleSchema.enum;

export const PayTypeSchema = z.enum(['PIECE', 'SALARY']);
export type PayType = z.infer<typeof PayTypeSchema>;
export const PayType = PayTypeSchema.enum;

export const CurrencySchema = z.enum(['KGS', 'RUB', 'KZT', 'USD']);
export type Currency = z.infer<typeof CurrencySchema>;
export const Currency = CurrencySchema.enum;

export const OrderStatusSchema = z.enum([
  'NEW',
  'CUTTING',
  'SEWING',
  'QC',
  'PACKING',
  'SHIPPED',
  'CANCELLED',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export const OrderStatus = OrderStatusSchema.enum;

export const BundleStatusSchema = z.enum([
  'CUT',
  'SEWING',
  'SEWN',
  'QC_PASSED',
  'REWORK',
  'PACKED',
]);
export type BundleStatus = z.infer<typeof BundleStatusSchema>;
export const BundleStatus = BundleStatusSchema.enum;

export const PayrollStatusSchema = z.enum(['DRAFT', 'APPROVED']);
export type PayrollStatus = z.infer<typeof PayrollStatusSchema>;
export const PayrollStatus = PayrollStatusSchema.enum;

export const AdjustmentTypeSchema = z.enum(['ADVANCE', 'BONUS', 'DEFECT_DEDUCTION']);
export type AdjustmentType = z.infer<typeof AdjustmentTypeSchema>;
export const AdjustmentType = AdjustmentTypeSchema.enum;

export const LocaleSchema = z.enum(['ky', 'ru']);
export type Locale = z.infer<typeof LocaleSchema>;
export const Locale = LocaleSchema.enum;
