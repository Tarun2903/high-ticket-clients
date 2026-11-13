"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Meta Pixel base code (+ optional Google Tag Manager).
 * Loads after the page is interactive so it never delays the hero render.
 * If you use GTM, do NOT also add Meta Pixel tags inside GTM – events would double count.
 */
export function Analytics({ pixelId, gtmId }: { pixelId?: string; gtmId?: string }) {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    // The base code fires the first PageView; this covers client-side navigations.
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  return (
    <>
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');fbq('track','PageView');
var q=window.__pxq||[];window.__pxq=null;q.forEach(function(a){fbq.apply(null,a)});`}
        </Script>
      )}
      {gtmId && (
        <Script id="gtm" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];(function(w,d,s,l,i){w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;
f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}
    </>
  );
}
