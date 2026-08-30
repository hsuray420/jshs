"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";

type DonationLinkProps = {
  children: ReactNode;
  className?: string;
  fallbackHref?: string;
};

export function DonationLink({ children, className, fallbackHref }: DonationLinkProps) {
  const [donationUrl, setDonationUrl] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/site-config", { headers: { accept: "application/json" } })
      .then((response): Promise<{ donation_url?: string }> => response.ok ? response.json() as Promise<{ donation_url?: string }> : Promise.resolve({}))
      .then((config) => {
        const url = String(config.donation_url || "").trim();
        if (/^https:\/\//i.test(url)) setDonationUrl(url);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  if (donationUrl) return <a href={donationUrl} target="_blank" rel="noreferrer" className={className}>{children}</a>;
  if (ready && fallbackHref) return <Link href={fallbackHref} className={className}>{children}</Link>;
  return null;
}
