
import React from 'react';
import { Link, useParams } from '@tanstack/react-router';


import { PermissionManager } from '../permissions/PermissionManager';

import { useAvailablePermissions, useUserPermissions } from '@/lib/hooks/usePermissions';
import { ChevronRightIcon, ShieldCheckIcon, UserIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';


export const UserPermissionsPage: React.FC = () => {
  const { userId } = useParams({ from: '/_authenticated/users/$userId/' });
  const { user: currentUser } = useAuthStore((state) => state.auth)
  
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useUserPermissions(userId);

  const {
    data: availableData,
    isLoading: availableLoading,
    error: availableError,
  } = useAvailablePermissions();

  const isLoading = userLoading || availableLoading;
  const error = userError || availableError;

  // Authorization check
  const canManagePermissions = currentUser?.role === 'admin' || currentUser?.userId === userId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Failed to load permissions
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Please try again later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData?.data || !availableData?.data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No permission data found
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { user, permissions } = userData.data;
  const availablePermissions = availableData.data;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link
                to="/users"
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Users
              </Link>
            </li>
            <li>
              <ChevronRightIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />
            </li>
            <li>
              <span className="text-gray-900 font-medium">{user.name}</span>
            </li>
            <li>
              <ChevronRightIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />
            </li>
            <li>
              <span className="text-gray-500">Permissions</span>
            </li>
          </ol>
        </nav>

        {/* User Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {user.name}
              </h1>
              <div className="flex flex-wrap gap-2">
                <span className={`
                  inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border
                  ${user.role === 'admin' 
                    ? 'bg-red-100 text-red-800 border-red-200' 
                    : 'bg-blue-100 text-blue-800 border-blue-200'
                  }
                `}>
                  <ShieldCheckIcon className="h-4 w-4" />
                  {user.role}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                  {user.email}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                  {permissions.length} permissions
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Management */}
        {canManagePermissions ? (
          <PermissionManager
            userId={userId}
            user={user}
            currentPermissions={permissions}
            availablePermissions={availablePermissions}
          />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Access Denied
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You don't have permission to manage permissions for this user.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};