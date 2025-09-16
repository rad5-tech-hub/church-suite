import { useEffect } from "react";
import { setActivePage, getActivePage } from "../util/pageToast";

export const usePageToast = (pageId: string) => {
  useEffect(() => {
    if (pageId) {
      setActivePage(pageId);
    }

    return () => {
      if (getActivePage() === pageId) {
        setActivePage("");
      }
    };
  }, [pageId]);
};
