import React, { useState } from 'react';

import type { Permission } from '../../../../lib/api/permissionService';
import { PermissionCheckbox } from './PermissionCheckbox';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

interface ResourcePermissionGroupProps {
  resource: {
    resource: string;
    label: string;
    actions: string[];
    permissions: Permission[];
  };
  selectedPermissions: string[];
  onPermissionChange: (permission: string, checked: boolean) => void;
  disabled?: boolean;
}

export const ResourcePermissionGroup: React.FC<ResourcePermissionGroupProps> = ({
  resource,
  selectedPermissions,
  onPermissionChange,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const selectedCount = resource.permissions.filter(p => 
    selectedPermissions.includes(p.permission)
  ).length;

  const allSelected = selectedCount === resource.permissions.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    resource.permissions.forEach(permission => {
      onPermissionChange(permission.permission, event.target.checked);
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden">
      {/* Header */}
      <div 
        className={`
          flex items-center justify-between p-4 cursor-pointer transition-colors
          ${isExpanded ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <button className="p-1 hover:bg-white/20 rounded">
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
          
          <h3 className="text-lg font-semibold">
            {resource.label}
          </h3>
          
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${isExpanded ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
          `}>
            {selectedCount}/{resource.permissions.length}
          </span>
        </div>

        <div 
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              disabled={disabled}
              className={`
                h-4 w-4 rounded border-2 focus:ring-2 focus:ring-offset-2
                ${isExpanded 
                  ? 'text-white border-white focus:ring-white' 
                  : 'text-blue-600 border-gray-300 focus:ring-blue-500'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
            Select All
          </label>
        </div>
      </div>
      
      {/* Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2">
            {resource.permissions.map((permission) => (
              <PermissionCheckbox
                key={permission.permission}
                permission={permission}
                checked={selectedPermissions.includes(permission.permission)}
                onChange={onPermissionChange}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};