import { createPortal } from "react-dom";

type Props = { children: React.ReactNode };

export default function ItemSearchPortal({ children }: Props) {
  if (typeof document === "undefined") return null;
  let root = document.getElementById("item-search-portal");
  if (!root) {
    root = document.createElement("div");
    root.id = "item-search-portal";
    document.body.appendChild(root);
  }
  return createPortal(children, root);
}
