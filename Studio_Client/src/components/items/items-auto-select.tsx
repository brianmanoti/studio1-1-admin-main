// src/components/ItemAutocomplete.tsx
/**
 * Professional Autocomplete Component
 * - Opens ONLY when the user types
 * - Works in tables and multiple rows
 * - Portal overlay (avoids clipping)
 * - Keyboard navigation (↑ ↓ Enter Esc)
 * - Click-outside closing
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import ItemSearchPortal from "./ItemSearchPortal";
import { useItemsVendors } from "@/hooks/use-items-vendors";

export type Item = {
  id?: string | number;
  _id?: string | number;
  name?: string;
  description?: string;
  unit?: string;
  unitPrice?: number;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  items: Item[];
  onSelect: (item: Item) => void;
  inputId?: string;
  placeholder?: string;
  disabled?: boolean;
  minChars?: number;
};

export default function ItemAutocomplete({
  value,
  onChange,
  items,
  onSelect,
  inputId,
  placeholder,
  disabled,
  minChars = 1,
}: Props) {
  const { setFormState } = useItemsVendors();

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [filtered, setFiltered] = useState<Item[]>([]);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>();
  const [userTyped, setUserTyped] = useState(false); // <-- track user typing

  // ---------------------------------------------------
  // Filtering logic — only open if user typed
  // ---------------------------------------------------
  useEffect(() => {
    const q = value.trim().toLowerCase();

    if (!q || q.length < minChars || !userTyped) {
      setFiltered([]);
      setOpen(false);
      return;
    }

    const results = items.filter(
      (it) =>
        it.name?.toLowerCase().includes(q) ||
        it.description?.toLowerCase().includes(q)
    );

    setFiltered(results);
    setActiveIdx(0);
    setOpen(results.length > 0);
  }, [value, items, minChars, userTyped]);

  // ---------------------------------------------------
  // Overlay positioning
  // ---------------------------------------------------
  const reposition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setOverlayStyle({
      position: "absolute",
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: Math.max(260, rect.width),
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (open) reposition();
  }, [open, filtered.length, reposition]);

  useEffect(() => {
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [reposition]);

  // ---------------------------------------------------
  // Close on outside click
  // ---------------------------------------------------
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (overlayRef.current?.contains(target)) return;
      if (inputRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ---------------------------------------------------
  // Keyboard navigation
  // ---------------------------------------------------
  const scrollActiveIntoView = () => {
    const container = overlayRef.current;
    if (!container) return;

    const active = container.querySelector<HTMLElement>(
      "[data-autocomplete-active='true']"
    );
    active?.scrollIntoView({ block: "nearest" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && e.key === "ArrowDown") {
      setOpen(filtered.length > 0);
      return;
    }

    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
        scrollActiveIntoView();
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
        scrollActiveIntoView();
        break;

      case "Enter":
        e.preventDefault();
        filtered[activeIdx] && handleSelect(filtered[activeIdx]);
        break;

      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  // ---------------------------------------------------
  // Input change — mark as user typed
  // ---------------------------------------------------
  const handleChange = (val: string) => {
    setUserTyped(true);
    onChange(val);
  };

  // ---------------------------------------------------
  // Select handler
  // ---------------------------------------------------
  const handleSelect = (item: Item) => {
    onSelect(item);
    setOpen(false);
  };

  // ---------------------------------------------------
  // Render
  // ---------------------------------------------------
  return (
    <>
      <input
        id={inputId}
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />

      {open && (
        <ItemSearchPortal>
          <div
            ref={overlayRef}
            style={overlayStyle}
            className="bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
            role="listbox"
            aria-label="Item suggestions"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-600 flex items-center justify-between">
                <span>No matches</span>
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => setFormState({ type: "add-item" })}
                >
                  + Add New Item
                </button>
              </div>
            ) : (
              filtered.slice(0, 50).map((it, index) => {
                const key = it.id ?? it._id ?? `${index}-${it.name}`;
                const active = index === activeIdx;

                return (
                  <div
                    key={key}
                    role="option"
                    aria-selected={active}
                    data-autocomplete-active={active ? "true" : "false"}
                    onMouseEnter={() => setActiveIdx(index)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(it);
                    }}
                    className={`px-3 py-2 cursor-pointer border-b last:border-b-0 ${
                      active ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-gray-900 truncate">
                      {it.name}
                    </div>
                    <div className="text-gray-500 text-xs truncate">
                      {it.description} • {it.unit} • KES{" "}
                      {Number(it.unitPrice || 0).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ItemSearchPortal>
      )}
    </>
  );
}
