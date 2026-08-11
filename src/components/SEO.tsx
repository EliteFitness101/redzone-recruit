import { Helmet } from "react-helmet-async";
import { SITE } from "@/config/site";

interface Props {
  title: string;
  description?: string;
  path?: string;
  jsonLd?: object;
  image?: string;
  /** Private/transactional routes: keep out of the index. */
  noindex?: boolean;
}

export const SEO = ({ title, description = SITE.description, path = "/", jsonLd, image, noindex }: Props) => {
  const url = `${SITE.domain}${path}`;
  const fullTitle = title.includes(SITE.shortName) ? title : `${title} — ${SITE.shortName}`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};
