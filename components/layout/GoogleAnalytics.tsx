import Script from "next/script";

/** Measurement ID GA4 della proprietà Fanta Laghèe (è pubblico, finisce comunque nell'HTML). */
const GA_ID_PREDEFINITO = "G-PB1BCHVWP2";

/**
 * Carica GA4 solo in produzione, così build locali e `next dev` non sporcano
 * le statistiche. `NEXT_PUBLIC_GA_ID` (se impostato) sovrascrive l'ID predefinito.
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || GA_ID_PREDEFINITO;
  if (!gaId || process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
