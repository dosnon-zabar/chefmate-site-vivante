"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useToast, type ToastType } from "./ToastProvider";

type Props = {
  /** Nom du param dans l'URL à surveiller (ex: "saved") */
  param: string;
  /** Valeur attendue pour déclencher le toast (ex: "1") */
  value?: string;
  /** Message à afficher */
  message: string;
  /** Type de toast */
  type?: ToastType;
};

/**
 * Affiche un toast en se basant sur un searchParam.
 * Nettoie ensuite le param de l'URL (via history.replaceState) pour éviter
 * que le toast ne réapparaisse à chaque refresh.
 */
export default function ToastFlash({ param, value = "1", message, type = "success" }: Props) {
  const searchParams = useSearchParams();
  const { show } = useToast();
  const hasShownRef = useRef(false);

  useEffect(() => {
    if (hasShownRef.current) return;
    if (searchParams.get(param) !== value) return;

    hasShownRef.current = true;
    show(message, type);

    // Retirer le param de l'URL sans re-render
    const url = new URL(window.location.href);
    url.searchParams.delete(param);
    window.history.replaceState({}, "", url.toString());
  }, [searchParams, param, value, message, type, show]);

  return null;
}
