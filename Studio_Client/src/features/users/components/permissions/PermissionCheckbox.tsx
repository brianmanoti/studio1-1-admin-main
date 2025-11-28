
import React from 'react';
import type { Permission } from '../../../../lib/api/permissionService';


interface PermissionCheckboxProps {
  permission: Permission;
  checked: boolean;
  onChange: (permission: string, checked: boolean) => void;
  disabled?: boolean;
}

const actionColors = {
  create: 'bg-green-100 text-green-800 border-green-200',
  read: 'bg-blue-100 text-blue-800 border-blue-200',
  update: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  delete: 'bg-red-100 text-red-800 border-red-200',
  approve: 'bg-purple-100 text-purple-800 border-purple-200',
  reject: 'bg-red-100 text-red-800 border-red-200',
  view: 'bg-gray-100 text-gray-800 border-gray-200',
  markPaid: 'bg-green-100 text-green-800 border-green-200',
  unapprove: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  export: 'bg-blue-100 text-blue-800 border-blue-200',
  generate: 'bg-purple-100 text-purple-800 border-purple-200',
  assign: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  complete: 'bg-green-100 text-green-800 border-green-200',
} as const;

export const PermissionCheckbox: React.FC<PermissionCheckboxProps> = ({
  permission,
  checked,
  onChange,
  disabled = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(permission.permission, event.target.checked);
  };

  const actionColor = actionColors[permission.action as keyof typeof actionColors] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <div className={`
      flex items-center gap-3 p-3 mb-2 rounded-lg border transition-all duration-200
      hover:bg-gray-50 hover:shadow-sm
      ${checked ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-200'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
      />
      
      <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
        <span className="text-sm font-medium text-gray-900 truncate">
          {permission.label}
        </span>
        
        <span className={`
          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
          ${actionColor}
        `}>
          {permission.action}
        </span>
        
        <span className="text-xs text-gray-500 font-mono truncate">
          ({permission.permission})
        </span>
      </div>
    </div>
  );
};