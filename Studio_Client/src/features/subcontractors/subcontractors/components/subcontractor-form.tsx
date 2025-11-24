// SubcontractorForm.tsx
import React, { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { 
  useCreateSubcontractor, 
  useUpdateSubcontractor, 
  type Subcontractor 
} from "@/hooks/use-subcontractors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, Building, User, Phone, Mail, Hammer, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// Validation schemas - Simplified without project allocation
const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  reference: z.string().optional(),
})

const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  typeOfWork: z.string().min(1, "Type of work is required"),
  status: z.enum(["pending", "approved", "declined"]),
  payments: z.array(paymentSchema).default([]),
})

type FormData = z.infer<typeof formSchema>
type Payment = z.infer<typeof paymentSchema>

interface SubcontractorFormProps {
  subcontractor?: Subcontractor
  onSuccess?: () => void
  onCancel?: () => void
}

const DEFAULT_PAYMENT: Payment = {
  amount: 0,
  date: new Date().toISOString().split("T")[0],
  description: "",
  reference: "",
}

export function SubcontractorForm({ subcontractor, onSuccess, onCancel }: SubcontractorFormProps) {
  const [activeSection, setActiveSection] = useState<"basic" | "payments">("basic")
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: subcontractor?.companyName || "",
      contactPerson: subcontractor?.contactPerson || "",
      phoneNumber: subcontractor?.phoneNumber || "",
      email: subcontractor?.email || "",
      typeOfWork: subcontractor?.typeOfWork || "",
      status: subcontractor?.status || "pending",
      payments: (subcontractor?.payments as Payment[]) || [],
    },
  })

  const { watch, setValue, getValues } = form
  const payments = watch("payments")

  const createMutation = useCreateSubcontractor()
  const updateMutation = useUpdateSubcontractor()
  const isLoading = createMutation.isPending || updateMutation.isPending

  // Payment management
  const handleAddPayment = useCallback((payment: Payment) => {
    const currentPayments = getValues("payments")
    setValue("payments", [...currentPayments, payment], { shouldValidate: true })
    toast.success("Payment added successfully")
  }, [getValues, setValue])

  const handleRemovePayment = useCallback((index: number) => {
    const currentPayments = getValues("payments")
    setValue("payments", currentPayments.filter((_, i) => i !== index), { shouldValidate: true })
    toast.info("Payment removed")
  }, [getValues, setValue])

  const onSubmit = async (data: FormData) => {
    try {
      if (subcontractor?._id) {
        await updateMutation.mutateAsync({
          id: subcontractor._id,
          data: data,
        })
        toast.success("Subcontractor updated successfully")
      } else {
        await createMutation.mutateAsync(data)
        toast.success("Subcontractor created successfully")
      }
      onSuccess?.()
    } catch (error: any) {
      console.error("Form submission error:", error)
      const errorMessage = error.response?.data?.message || "Failed to save subcontractor. Please try again."
      toast.error(errorMessage)
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs - Simplified without projects */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1">
        {[
          { id: "basic" as const, label: "Basic Info", icon: Building },
          { id: "payments" as const, label: `Payments (${payments.length})`, icon: CreditCard },
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            type="button"
            variant={activeSection === id ? "default" : "ghost"}
            className="flex-1"
            onClick={() => setActiveSection(id)}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <ScrollArea className="h-[60vh] pr-4">
            {activeSection === "basic" && <BasicInfoSection form={form} />}
            {activeSection === "payments" && (
              <PaymentsSection
                payments={payments}
                onAddPayment={handleAddPayment}
                onRemovePayment={handleRemovePayment}
              />
            )}
          </ScrollArea>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {subcontractor ? "Update Subcontractor" : "Create Subcontractor"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}

// Basic Info Section Component
interface BasicInfoSectionProps {
  form: any
}

function BasicInfoSection({ form }: BasicInfoSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Company Name
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Contact Person
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter contact person" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Phone Number
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email Address
              </FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="typeOfWork"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Hammer className="h-4 w-4 mr-2" />
                Type of Work
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter type of work" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

// Payments Section Component
interface PaymentsSectionProps {
  payments: Payment[]
  onAddPayment: (payment: Payment) => void
  onRemovePayment: (index: number) => void
}

function PaymentsSection({ payments, onAddPayment, onRemovePayment }: PaymentsSectionProps) {
  const [newPayment, setNewPayment] = useState<Payment>(DEFAULT_PAYMENT)

  const handleAdd = () => {
    try {
      paymentSchema.parse(newPayment)
      onAddPayment(newPayment)
      setNewPayment(DEFAULT_PAYMENT)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0]
        toast.error(`Validation error: ${firstError.message}`)
      }
    }
  }

  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const isPaymentValid = newPayment.amount > 0 && newPayment.date

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Payment Summary
            <Badge variant="secondary">
              Total: KES {totalPayments.toLocaleString("en-KE")}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Existing Payments */}
      {payments.length > 0 ? (
        <div className="space-y-3">
          <Label>Payment History ({payments.length})</Label>
          {payments.map((payment, index) => (
            <PaymentCard
              key={index}
              payment={payment}
              onRemove={() => onRemovePayment(index)}
            />
          ))}
        </div>
      ) : (
        <Alert>
          <AlertDescription>
            No payments recorded yet. Add payments to track disbursements.
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Add New Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Add New Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Amount (KES) *</Label>
              <Input
                id="paymentAmount"
                value={newPayment.amount === 0 ? "" : newPayment.amount}
                onChange={(e) => {
                  const value = e.target.value
                  setNewPayment(prev => ({ 
                    ...prev, 
                    amount: value === "" ? 0 : Number.parseFloat(value) || 0 
                  }))
                }}
                placeholder="0.00"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={newPayment.date}
                onChange={(e) => setNewPayment(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDescription">Description</Label>
            <Input
              id="paymentDescription"
              value={newPayment.description}
              onChange={(e) => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Payment description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentReference">Reference</Label>
            <Input
              id="paymentReference"
              value={newPayment.reference}
              onChange={(e) => setNewPayment(prev => ({ ...prev, reference: e.target.value }))}
              placeholder="Payment reference number"
            />
          </div>

          <Button
            type="button"
            onClick={handleAdd}
            disabled={!isPaymentValid}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Individual Payment Card Component
interface PaymentCardProps {
  payment: Payment
  onRemove: () => void
}

function PaymentCard({ payment, onRemove }: PaymentCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold">KES {payment.amount.toLocaleString("en-KE")}</h4>
              <Badge variant="outline">
                {new Date(payment.date).toLocaleDateString("en-KE")}
              </Badge>
            </div>
            {payment.description && (
              <p className="text-sm text-muted-foreground">{payment.description}</p>
            )}
            {payment.reference && (
              <p className="text-sm">
                <span className="font-medium">Reference:</span> {payment.reference}
              </p>
            )}
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={onRemove}
            title="Remove payment"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default SubcontractorForm