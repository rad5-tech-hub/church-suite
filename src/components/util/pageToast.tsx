// utils/pageToast.ts
import { toast, ToastOptions } from "react-toastify";

let activePageId: string | null = null;
const pageToasts: Record<string, string[]> = {}; // track toastIds by page

export const setActivePage = (pageId: string) => {
  if (activePageId && pageToasts[activePageId]) {
    pageToasts[activePageId].forEach((id) => toast.dismiss(id));
    pageToasts[activePageId] = [];
  }
  activePageId = pageId;
};

export const getActivePage = () => activePageId;

export const showPageToast = (
  message: React.ReactNode | string,
  type: "success" | "error" | "warning" = "success",
  options?: ToastOptions
) => {
  if (!activePageId) {
    console.warn("⚠️ Call setActivePage(pageId) in your component first.");
    return;
  }

  const id = `toast-${activePageId}-${Date.now()}`;
  const timestamp = new Date().toLocaleTimeString();

  const content = (
    <div>
      {message}
      <div style={{ fontSize: "0.75rem", color: "#888" }}>{timestamp}</div>
    </div>
  );

  switch (type) {
    case "success":
      toast.success(content, { ...options, toastId: id });
      break;
    case "error":
      toast.error(content, { ...options, toastId: id });
      break;
    case "warning":
      toast.warn(content, { ...options, toastId: id });
      break;
  }

  if (!pageToasts[activePageId]) {
    pageToasts[activePageId] = [];
  }
  pageToasts[activePageId].push(id);

  return id;
};
