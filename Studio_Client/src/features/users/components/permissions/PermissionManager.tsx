
import React, { useState, useEffect } from 'react';
import { SaveIcon, RefreshCwIcon } from 'lucide-react';
import { ResourcePermissionGroup } from './ResourcePermissionGroup';

import type { Permission, AvailablePermissionsResponse } from '../../../../lib/api/permissionService';
import { useResetPermissions, useUpdatePermissions } from '@/lib/hooks/usePermissions';

interface PermissionManagerProps {
  userId: string;
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  currentPermissions: string[];
  availablePermissions: AvailablePermissionsResponse['data'];
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  userId,
  user,
  currentPermissions,
  availablePermissions,
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const updateMutation = useUpdatePermissions(userId);
  const resetMutation = useResetPermissions(userId);

  const isLoading = updateMutation.isPending || resetMutation.isPending;

  const { byResource = [], permissionsList = [] } = availablePermissions;

  useEffect(() => {
    setSelectedPermissions(currentPermissions);
  }, [currentPermissions]);

  useEffect(() => {
    const hasChanged = 
      currentPermissions.length !== selectedPermissions.length ||
      currentPermissions.some(p => !selectedPermissions.includes(p)) ||
      selectedPermissions.some(p => !currentPermissions.includes(p));
    
    setHasChanges(hasChanged);
  }, [selectedPermissions, currentPermissions]);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setSelectedPermissions(prev => {
      if (checked) {
        return [...prev, permission];
      } else {
        return prev.filter(p => p !== permission);
      }
    });
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync(selectedPermissions);
  };

  const handleReset = async () => {
    await resetMutation.mutateAsync();
  };

  const selectedCount = selectedPermissions.length;
  const totalCount = permissionsList.length;

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Permission Management
            </h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
              {selectedCount} of {totalCount} permissions selected
            </span>
          </div>
        </div>

        {hasChanges && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  You have unsaved changes. Click Save to apply them.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              {byResource.map((resource) => (
                <ResourcePermissionGroup
                  key={resource.resource}
                  resource={resource}
                  selectedPermissions={selectedPermissions}
                  onPermissionChange={handlePermissionChange}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isLoading}
                  className={`
                    w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent 
                    rounded-md shadow-sm text-sm font-medium text-white
                    ${!hasChanges || isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }
                    transition-colors duration-200
                  `}
                >
                  {isLoading ? (
                    <RefreshCwIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SaveIcon className="h-4 w-4" />
                  )}
                  {isLoading ? 'Saving...' : 'Save Permissions'}
                </button>
                
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className={`
                    w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 
                    rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white
                    ${isLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }
                    transition-colors duration-200
                  `}
                >
                  <RefreshCwIcon className="h-4 w-4" />
                  Reset to Defaults
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Permissions:</span>
                  <span className="text-sm font-medium text-gray-900">{totalCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Selected:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Coverage:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {((selectedCount / totalCount) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};