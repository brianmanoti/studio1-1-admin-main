
import { useCallback, useEffect, useState } from "react";

type Rect = { top: number; left: number; width: number; height: number } | null;

export default function useOverlayPosition() {
  const [rect, setRect] = useState<Rect>(null);

  const update = useCallback((el?: HTMLElement | null) => {
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.bottom + window.scrollY,
      left: r.left + window.scrollX,
      width: r.width,
      height: r.height,
    });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      // calling update requires a ref, so consumer should call on their ref changes
    };
    const onResize = () => {
      // consumer should call update with current ref on resize
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return { rect, update, setRect };
}
