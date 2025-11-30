import * as React from "react"

interface AutocompleteItem {
  _id: string
  label: string
  subtitle?: string
  extra?: string
}

interface AutocompleteProps {
  label: string
  placeholder?: string
  items: AutocompleteItem[]
  value?: string
  onChange: (value: string) => void
  onSelect: (item: AutocompleteItem) => void
  isLoading?: boolean
  isError?: boolean
  disabled?: boolean
  error?: string
  selectedItem?: AutocompleteItem | null
}

export function Autocomplete({
  label,
  placeholder,
  items,
  value,
  onChange,
  onSelect,
  isLoading,
  isError,
  disabled,
  error,
  selectedItem,
}: AutocompleteProps) {
  const [active, setActive] = React.useState(false)

  return (
    <div className="relative space-y-1">
      <label className="block text-sm font-medium text-gray-600">{label}</label>

      <div className="relative">
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50"
          placeholder={placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setActive(true)}
          onBlur={() => setTimeout(() => setActive(false), 150)}
          disabled={disabled}
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {active && value && (
        <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-md w-full max-h-60 overflow-auto mt-1">
          {isLoading && (
            <div className="px-4 py-2 text-gray-500 text-sm">Loading...</div>
          )}
          {isError && (
            <div className="px-4 py-2 text-red-500 text-sm">Failed to load items</div>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <div className="px-4 py-2 text-gray-500 text-sm">No results found</div>
          )}
          {!isLoading &&
            !isError &&
            items.map((item) => (
              <div
                key={item._id}
                onClick={() => onSelect(item)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-900">{item.label}</div>
                {item.subtitle && <div className="text-sm text-gray-600">{item.subtitle}</div>}
                {item.extra && <div className="text-xs text-green-600 mt-1">{item.extra}</div>}
              </div>
            ))}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      {/* Selected Item Card */}
      {selectedItem && !active && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="font-medium text-gray-900">{selectedItem.label}</div>
          {selectedItem.subtitle && (
            <div className="text-sm text-gray-600">{selectedItem.subtitle}</div>
          )}
          {selectedItem.extra && (
            <div className="text-xs text-green-600 mt-1">{selectedItem.extra}</div>
          )}
        </div>
      )}
    </div>
  )
}
