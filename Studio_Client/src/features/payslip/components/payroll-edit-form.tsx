// src/features/payslip/components/payroll-edit-form.tsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import axiosInstance from '@/lib/axios'

const PayrollSchema = z.object({
  employeeName: z.string().min(2),
  date: z.string(),
  grossPay: z.number().min(0),
  allowanceDeductions: z.number().min(0),
  personalRelief: z.number().min(0),
  preparedBy: z.string().min(2),
  status: z.enum(['draft', 'final', 'archived']),
  customDeductions: z.array(
    z.object({
      name: z.string().min(1),
      amount: z.number().min(0),
      isPercentage: z.boolean(),
    })
  ),
})

type PayrollFormValues = z.infer<typeof PayrollSchema>

async function fetchPayslip(id: string) {
  const { data } = await axiosInstance.get(`/api/pay-slip/${id}`)
  // Ensure calculations object exists
  data.calculations = data.calculations || {
    paye: 0,
    nssfTier1: 0,
    nssfTier2: 0,
    shif: 0,
    housingLevy: 0,
    customTotal: 0,
    totalDeductions: 0,
    netPay: 0,
    taxablePay: 0,
  }
  data.customDeductions = data.customDeductions || []
  return data
}

export default function PayrollEditForm() {
  const { projectId, PayslipId } = useParams({
    from: '/_authenticated/projects/$projectId/payslip/$PayslipId/edit/',
  })

  const navigate = useNavigate({
    from: '/_authenticated/projects/$projectId/payslip/$PayslipId/edit/',
  })

  const { data: payroll, isLoading, isError } = useQuery({
    queryKey: ['payslip', PayslipId],
    queryFn: () => fetchPayslip(PayslipId),
    enabled: !!PayslipId,
    staleTime: 300_000,
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<PayrollFormValues>({
    resolver: zodResolver(PayrollSchema),
    defaultValues: {
      customDeductions: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customDeductions',
  })

  useEffect(() => {
    if (payroll) {
      reset({
        employeeName: payroll.employeeName,
        date: payroll.date?.split('T')[0] || '',
        grossPay: payroll.grossPay ?? 0,
        allowanceDeductions: payroll.allowanceDeductions ?? 0,
        personalRelief: payroll.personalRelief ?? 0,
        preparedBy: payroll.preparedBy,
        status: payroll.status,
        customDeductions: payroll.customDeductions ?? [],
      })
    }
  }, [payroll, reset])

  const mutation = useMutation({
    mutationFn: async (data: PayrollFormValues) => {
      const res = await axiosInstance.patch(`/api/pay-slip/${PayslipId}`, data)
      // reset with backend returned calculations
      reset({
        employeeName: res.data.data.employeeName,
        date: res.data.data.date?.split('T')[0] || '',
        grossPay: res.data.data.grossPay,
        allowanceDeductions: res.data.data.allowanceDeductions,
        personalRelief: res.data.data.personalRelief,
        preparedBy: res.data.data.preparedBy,
        status: res.data.data.status,
        customDeductions: res.data.data.customDeductions || [],
      })
      return res.data
    },
    onSuccess: () => {
      toast.success('Payslip updated successfully 🎉', { duration: 3000 })
      navigate({
        to: '/projects/$projectId/payslip',
        params: { projectId },
      })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to update payslip'
      toast.error(message)
    },
  })

  const onSubmit = (data: PayrollFormValues) => mutation.mutate(data)

  const watchedValues = watch(['grossPay', 'allowanceDeductions', 'personalRelief', 'customDeductions'])

  // Calculate totals for display
  const calculatedTotals = React.useMemo(() => {
    const gross = watchedValues[0] || 0
    const allowances = watchedValues[1] || 0
    const relief = watchedValues[2] || 0
    const customs = watchedValues[3] || []

    const customTotal = customs.reduce((sum, c: any) => {
      const amt = c.isPercentage ? (gross * c.amount) / 100 : c.amount
      return sum + amt
    }, 0)

    const taxablePay = gross - allowances
    const paye = taxablePay * 0.1 - relief // example 10% tax
    const nssfTier1 = gross * 0.06
    const nssfTier2 = gross * 0.06
    const shif = gross * 0.01
    const housingLevy = gross * 0.01
    const totalDeductions = paye + nssfTier1 + nssfTier2 + shif + housingLevy + customTotal
    const netPay = gross - totalDeductions

    return { taxablePay, paye, nssfTier1, nssfTier2, shif, housingLevy, customTotal, totalDeductions, netPay }
  }, [watchedValues])

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen bg-blue-50">
        <div className="animate-pulse text-blue-600 text-lg font-medium">
          Loading payroll data...
        </div>
      </div>
    )

  if (isError || !payroll)
    return (
      <div className="flex justify-center items-center h-screen bg-blue-50">
        <div className="text-red-600 text-lg font-medium">
          Failed to load payroll record.
        </div>
      </div>
    )

  return (
    <div className="min-h-screen w-full bg-blue-50 py-10 px-4 sm:px-8 lg:px-16">
      <div className="w-full max-w-6xl mx-auto bg-white shadow-xl rounded-lg p-8 md:p-10 border-t-4 border-blue-600">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-blue-700">✏️ Edit Payroll Record</h1>
          <button
            onClick={() =>
              navigate({
                to: '/projects/$projectId/payslip',
                params: { projectId },
              })
            }
            className="px-5 py-2 bg-blue-100 text-blue-700 font-medium rounded-md hover:bg-blue-200 transition"
          >
            ← Back to Payslips
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1">Employee Name</label>
              <input
                {...register('employeeName')}
                className="w-full border border-blue-200 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.employeeName && (
                <p className="text-red-500 text-sm mt-1">{errors.employeeName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1">Date</label>
              <input
                type="date"
                {...register('date')}
                className="w-full border border-blue-200 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1">Gross Pay</label>
              <input
                type="number"
                {...register('grossPay', { valueAsNumber: true })}
                className="w-full border border-blue-200 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1">Allowance Deductions</label>
              <input
                type="number"
                {...register('allowanceDeductions', { valueAsNumber: true })}
                className="w-full border border-blue-200 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1">Personal Relief</label>
              <input
                type="number"
                {...register('personalRelief', { valueAsNumber: true })}
                className="w-full border border-blue-200 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1">Prepared By</label>
              <input
                {...register('preparedBy')}
                className="w-full border border-blue-200 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full border border-blue-200 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="final">Final</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Custom Deductions */}
          <div className="pt-6">
            <h2 className="text-xl font-semibold text-blue-700 mb-3 border-b pb-2 border-blue-200">Custom Deductions</h2>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <input
                    {...register(`customDeductions.${index}.name` as const)}
                    placeholder="Name"
                    className="border p-2 rounded w-1/3"
                  />
                  <input
                    type="number"
                    {...register(`customDeductions.${index}.amount` as const, { valueAsNumber: true })}
                    placeholder="Amount"
                    className="border p-2 rounded w-1/4"
                  />
                  <label className="flex items-center gap-1">
                    <input type="checkbox" {...register(`customDeductions.${index}.isPercentage` as const)} />
                    %
                  </label>
                  <button
                    type="button"
                    className="text-red-600 font-bold px-2"
                    onClick={() => remove(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded"
                onClick={() => append({ name: '', amount: 0, isPercentage: true })}
              >
                + Add Custom Deduction
              </button>
            </div>
          </div>

          {/* Calculations */}
          <div className="pt-8">
            <h2 className="text-xl font-semibold text-blue-700 mb-3 border-b pb-2 border-blue-200">Calculated Deductions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-blue-200 text-sm">
                <tbody>
                  {Object.entries(calculatedTotals).map(([key, val]) => (
                    <tr key={key} className="odd:bg-blue-50 even:bg-white">
                      <td className="border border-blue-100 px-3 py-2 font-medium capitalize">{key}</td>
                      <td className="border border-blue-100 px-3 py-2 text-right text-blue-800">
                        {typeof val === 'number' ? val.toLocaleString('en-KE', { maximumFractionDigits: 2 }) : String(val)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-8">
            <button
              type="submit"
              disabled={mutation.isPending}
              className={`px-8 py-2.5 text-white font-medium rounded-md shadow-md transition ${
                mutation.isPending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {mutation.isPending ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
