/**
 * JL Analytics — canonical GA4 + Cloudflare Web Analytics loader for Next.js.
 *
 * Reads tokens from env at build time:
 *   NEXT_PUBLIC_GA4_ID
 *   NEXT_PUBLIC_CF_ANALYTICS_TOKEN
 *
 * If either env var is absent, that beacon is silently skipped.
 * Non-blocking: uses next/script with afterInteractive.
 */

import Script from "next/script";

export function Analytics() {
  const ga4 = process.env.NEXT_PUBLIC_GA4_ID;
  const cfToken = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;

  return (
    <>
      {ga4 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4}', { anonymize_ip: true, cookie_flags: 'SameSite=Lax;Secure' });
            `}
          </Script>
        </>
      )}
      {cfToken && (
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          data-cf-beacon={JSON.stringify({ token: cfToken, spa: true })}
        />
      )}
    </>
  );
}
