// hooks/usePageToast.ts
import { useEffect } from "react";
import { setActivePage } from "../util/pageToast";

export const usePageToast = (pageId: string) => {
  useEffect(() => {
    // set active page on mount
    setActivePage(pageId);

    // cleanup on unmount
    return () => setActivePage(""); 
  }, [pageId]);
};
