declare global {
  interface Window {
    FlutterwaveCheckout?: (config: Record<string, unknown>) => void;
  }
}

let flutterwaveScriptPromise: Promise<void> | null = null;

function loadFlutterwaveScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Flutterwave checkout is only available in the browser.'));
  }

  if (window.FlutterwaveCheckout) {
    return Promise.resolve();
  }

  if (!flutterwaveScriptPromise) {
    flutterwaveScriptPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-flutterwave="checkout"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Unable to load Flutterwave checkout.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      script.dataset.flutterwave = 'checkout';
      script.onload = () => resolve();
      script.onerror = () => {
        flutterwaveScriptPromise = null;
        reject(new Error('Unable to load Flutterwave checkout.'));
      };
      document.head.appendChild(script);
    });
  }

  return flutterwaveScriptPromise;
}

export interface FlutterwaveFundingResponse {
  tx_ref: string;
  amount: number;
  currency: string;
  publicKey: string;
  customer?: {
    email?: string;
    name?: string;
  };
}

export interface FlutterwaveCheckoutOptions {
  publicKey: string;
  txRef: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    name: string;
  };
  title?: string;
  description?: string;
  onComplete?: () => void;
  onClose?: () => void;
}

export async function openFlutterwaveCheckout(options: FlutterwaveCheckoutOptions) {
  await loadFlutterwaveScript();

  if (!window.FlutterwaveCheckout) {
    throw new Error('Flutterwave checkout is unavailable.');
  }

  window.FlutterwaveCheckout({
    public_key: options.publicKey,
    tx_ref: options.txRef,
    amount: options.amount,
    currency: options.currency,
    customer: options.customer,
    customizations: {
      title: options.title || 'Churchset',
      description: options.description || 'Wallet funding',
    },
    callback: () => {
      options.onComplete?.();
    },
    onclose: () => {
      options.onClose?.();
    },
  });
}
