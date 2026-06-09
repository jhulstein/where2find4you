"use client";

import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIosDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallAppButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandalone());
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIos] = useState(() => isIosDevice());

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // The install button still works as an iOS/browser instruction fallback.
      });
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowInstructions(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }

      setInstallPrompt(null);
      return;
    }

    setShowInstructions(true);
  }

  if (isInstalled) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleInstall}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
      >
        <Download aria-hidden="true" size={16} />
        <span className="hidden sm:inline">Add app</span>
        <span className="sm:hidden">App</span>
      </button>

      {showInstructions ? (
        <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
                {isIos ? (
                  <Share aria-hidden="true" size={18} />
                ) : (
                  <Smartphone aria-hidden="true" size={18} />
                )}
              </span>
              <div>
                <p className="font-semibold text-slate-950">Add to Home Screen</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {isIos
                    ? "On iPhone or iPad: tap Share, then choose Add to Home Screen."
                    : "If your browser does not show an install prompt, open the browser menu and choose Install app or Add to Home screen."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close install instructions"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
