import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'
import { useAuthStore } from '@/stores/auth-store'

const profileFormSchema = z.object({
  // Basic Info
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50, 'Name is too long.'),
  email: z.string().email('Please enter a valid email address.'),
  profileImage: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  
  // Preferences
  preferences: z.object({
    profile: z.object({
      theme: z.string(),
      language: z.string(),
    }),
    notifications: z.object({
      email: z.boolean(),
      system: z.boolean(),
      projectUpdates: z.boolean(),
      taskAssignments: z.boolean(),
      financialAlerts: z.boolean(),
      sms: z.boolean(),
      push: z.boolean(),
    }),
  }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const queryClient = useQueryClient()
  const { user: authUser } = useAuthStore((state) => state.auth)
  const userId = authUser?.userId // Get userId from auth store

  // Fetch user data using userId
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/auth/${userId}`)
      return response.data.user
    },
    enabled: !!userId, // Only run query if userId exists
  })

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await axiosInstance.patch(`/api/auth/${userId}`, {
        name: data.name,
        email: data.email,
        profileImage: data.profileImage,
        preferences: data.preferences,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      showSubmittedData('Profile updated successfully!')
    },
    onError: (error) => {
      console.error('Failed to update profile:', error)
      showSubmittedData('Failed to update profile. Please try again.')
    },
  })

  // Transform API data to form default values
  const getDefaultValues = (): ProfileFormValues => {
    if (!userData) {
      return {
        name: '',
        email: '',
        profileImage: '',
        preferences: {
          profile: {
            theme: 'light',
            language: 'en',
          },
          notifications: {
            email: true,
            system: true,
            projectUpdates: true,
            taskAssignments: true,
            financialAlerts: false,
            sms: false,
            push: true,
          },
        },
      }
    }

    return {
      name: userData.name || '',
      email: userData.email || '',
      profileImage: userData.profileImage || '',
      preferences: userData.preferences || {
        profile: {
          theme: 'light',
          language: 'en',
        },
        notifications: {
          email: true,
          system: true,
          projectUpdates: true,
          taskAssignments: true,
          financialAlerts: false,
          sms: false,
          push: true,
        },
      },
    }
  }

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  })

  // Reset form when user data is loaded
  React.useEffect(() => {
    if (userData) {
      form.reset(getDefaultValues())
    }
  }, [userData, form])

  const onSubmit = (data: ProfileFormValues) => {
    updateUserMutation.mutate(data)
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center text-destructive">
          <p>User not authenticated. Please log in.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Loading profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Account Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">User ID:</span>
              <p className="text-muted-foreground">{userData?.userId}</p>
            </div>
            <div>
              <span className="font-medium">Role:</span>
              <Badge variant="secondary" className="ml-2 capitalize">
                {userData?.role}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <Badge 
                variant={userData?.status === 'active' ? 'default' : 'secondary'} 
                className="ml-2 capitalize"
              >
                {userData?.status}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Email Verified:</span>
              <Badge 
                variant={userData?.isEmailVerified ? 'default' : 'destructive'} 
                className="ml-2"
              >
                {userData?.isEmailVerified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Member Since:</span>
              <p className="text-muted-foreground">
                {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>
              <p className="text-muted-foreground">
                {userData?.updatedAt ? new Date(userData.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update your basic profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Brian Manoti" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="brianmanoti254@gmail.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your primary email address for account communications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="profileImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/avatar.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter a URL for your profile picture
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Profile Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Preferences</CardTitle>
              <CardDescription>
                Customize your profile settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="preferences.profile.theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="preferences.profile.language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="preferences.notifications.email"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Email Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications via email
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferences.notifications.system"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">System Notifications</FormLabel>
                        <FormDescription>
                          Receive system-wide notifications
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferences.notifications.projectUpdates"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Project Updates</FormLabel>
                        <FormDescription>
                          Notifications about project changes
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferences.notifications.taskAssignments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Task Assignments</FormLabel>
                        <FormDescription>
                          Notifications when you're assigned tasks
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferences.notifications.financialAlerts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Financial Alerts</FormLabel>
                        <FormDescription>
                          Important financial notifications
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferences.notifications.sms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">SMS Notifications</FormLabel>
                        <FormDescription>
                          Receive text message notifications
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferences.notifications.push"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Push Notifications</FormLabel>
                        <FormDescription>
                          Browser or mobile push notifications
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            disabled={updateUserMutation.isPending}
            className="w-full sm:w-auto"
          >
            {updateUserMutation.isPending ? 'Updating Profile...' : 'Update Profile'}
          </Button>
        </form>
      </Form>
    </div>
  )
}