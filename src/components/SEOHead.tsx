import Head from "next/head";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
}

export function SEOHead({
  title = "Policast - Political Prediction Markets",
  description = "Join the decentralized political prediction market. Bet on election outcomes, policy decisions, and political events with crypto.",
  keywords = [
    "political prediction markets",
    "election betting",
    "political trading",
    "crypto betting",
  ],
  image = "/icon.jpg",
  url = "https://buster-mkt.vercel.app",
}: SEOHeadProps) {
  const fullTitle = title.includes("Policast") ? title : `${title} | Policast`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(", ")} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${url}${image}`} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${url}${image}`} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <link rel="canonical" href={url} />
    </Head>
  );
}
