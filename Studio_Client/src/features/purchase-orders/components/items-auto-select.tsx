// src/components/ItemAutocomplete.tsx
/**
 * src/components/ItemAutocomplete.tsx
 *
 * Reusable autocomplete overlay component for item lookup.
 * - Portal-based overlay so it's not clipped by table cells
 * - Keyboard accessible (ArrowUp/ArrowDown/Enter/Escape)
 * - Click outside to close
 * - Exposes controlled selection via onSelect
 */

import React, { useEffect, useRef, useState } from "react";
import ItemSearchPortal from "./ItemSearchPortal";

type Item = {
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
  items: Item[]; // full list to filter client-side
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [filtered, setFiltered] = useState<Item[]>([]);

  // compute filtered
  useEffect(() => {
    if (!value || value.trim().length < minChars) {
      setFiltered([]);
      setOpen(false);
      return;
    }
    const q = value.toLowerCase();
    const f = items.filter(
      (it) =>
        (it.name && it.name.toLowerCase().includes(q)) ||
        (it.description && it.description.toLowerCase().includes(q)),
    );
    setFiltered(f);
    setActiveIdx(0);
    setOpen(true);
  }, [value, items, minChars]);

  // overlay positioning values
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties | undefined>(undefined);

  const reposition = () => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setOverlayStyle({
      position: "absolute",
      top: r.bottom + window.scrollY + 6,
      left: r.left + window.scrollX,
      width: Math.max(260, r.width),
      zIndex: 9999,
    });
  };

  useEffect(() => {
    if (open) reposition();
  }, [open, filtered.length]);

  useEffect(() => {
    const onResize = () => reposition();
    const onScroll = () => reposition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  // close when clicking outside
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node | null;
      if (!t) return;
      if (overlayRef.current?.contains(t)) return;
      if (inputRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // keyboard handling
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((s) => Math.min(s + 1, Math.max(0, filtered.length - 1)));
      scrollActiveIntoView();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((s) => Math.max(0, s - 1));
      scrollActiveIntoView();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[activeIdx];
      if (it) handleSelect(it);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const scrollActiveIntoView = () => {
    const el = overlayRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>("[data-autocomplete-active='true']");
    active?.scrollIntoView({ block: "nearest" });
  };

  const handleSelect = (it: Item) => {
    onSelect(it);
    setOpen(false);
  };

  return (
    <>
      <input
        id={inputId}
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => (filtered.length > 0 ? setOpen(true) : null)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        autoComplete="off"
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
              <div className="px-3 py-2 text-gray-500 text-sm">No matches</div>
            ) : (
              filtered.slice(0, 50).map((it, i) => {
                const key = it.id ?? it._id ?? `${i}-${it.name}`;
                const active = i === activeIdx;
                return (
                  <div
                    key={key}
                    data-autocomplete-active={active ? "true" : "false"}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIdx(i)}
                    onMouseDown={(e) => {
                      // use mouseDown to avoid input blur before click
                      e.preventDefault();
                      handleSelect(it);
                    }}
                    className={`px-3 py-2 cursor-pointer border-b last:border-b-0 ${
                      active ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-gray-900 truncate">{it.name}</div>
                    <div className="text-gray-500 text-xs truncate">
                      {it.description} • {it.unit} • KES {Number(it.unitPrice || 0).toLocaleString()}
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
