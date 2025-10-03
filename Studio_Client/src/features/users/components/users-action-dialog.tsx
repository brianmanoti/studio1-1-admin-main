'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'


import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import axiosInstance from '@/lib/axios'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ✅ Validation Schema based on your Mongo schema
const formSchema = z
  .object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm Password is required'),
    role: z.enum(['user', 'admin'], { required_error: 'Role is required' }),
    status: z.enum(['active', 'inactive'], {
      required_error: 'Status is required',
    }),
    isEdit: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type UserForm = z.infer<typeof formSchema>

type UserActionDialogProps = {
  currentRow?: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UserActionDialogProps) {
  const isEdit = !!currentRow
  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow?.name || '',
          email: currentRow?.email || '',
          password: '',
          confirmPassword: '',
          role: currentRow?.role || 'user',
          status: currentRow?.status || 'active',
          isEdit,
        }
      : {
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'user',
          status: 'active',
          isEdit,
        },
  })

  const queryClient = useQueryClient()

  // ✅ Minimal change: mutation uses axios instance
  const mutation = useMutation({
    mutationFn: async (data: UserForm) => {
      const payload = {
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password.trim(),
        role: data.role,
        status: data.status,
      }

      // ✅ Consistent Mongo schema: use userId param for edit
      if (isEdit && currentRow?.userId) {
        const res = await axiosInstance.put(`/api/auth/${currentRow.userId}/admin-update`, payload)
        return res.data
      } else {
        const res = await axiosInstance.post('/api/auth/register', payload)
        return res.data
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'User updated successfully!' : 'User created successfully!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      form.reset()
      onOpenChange(false) // ✅ Close only after success
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Something went wrong.')
    },
  })

  const onSubmit = (values: UserForm) => mutation.mutate(values)

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the user details here.' : 'Fill in the details to create a new user.'}
          </DialogDescription>
        </DialogHeader>

        <div className='h-[26.25rem] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              {/* Name */}
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Name</FormLabel>
                    <FormControl className='w-full'>
                      <Input className='w-full' placeholder='John Doe' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Email</FormLabel>
                    <FormControl className='w-full'>
                      <Input className='w-full' type='email' placeholder='john@example.com' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role + Status Grid */}
              <div className='grid grid-cols-2 gap-4'>
                {/* Role */}
                <FormField
                  control={form.control}
                  name='role'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Role</FormLabel>
                      <FormControl className='w-full'>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select role' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='user'>User</SelectItem>
                            <SelectItem value='admin'>Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Status</FormLabel>
                      <FormControl className='w-full'>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select status' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='active'>Active</SelectItem>
                            <SelectItem value='inactive'>Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Password */}
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Password</FormLabel>
                    <FormControl className='w-full'>
                      <PasswordInput className='w-full' placeholder='Enter password' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl className='w-full'>
                      <PasswordInput className='w-full' placeholder='Confirm password' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter>
          <Button
            type='submit'
            form='user-form'
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {mutation.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
