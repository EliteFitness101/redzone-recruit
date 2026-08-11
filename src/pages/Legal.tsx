import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/SEO";
import { SITE } from "@/config/site";
import { LEGAL_DOCS, legalBySlug } from "@/content/legal";

const LAST_UPDATED = "11 August 2026";

const Legal = () => {
  const { slug } = useParams();
  const doc = slug ? legalBySlug(slug) : undefined;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.domain}/` },
      { "@type": "ListItem", position: 2, name: "Legal & Policies", item: `${SITE.domain}/legal` },
      ...(doc
        ? [{ "@type": "ListItem", position: 3, name: doc.title, item: `${SITE.domain}/legal/${doc.slug}` }]
        : []),
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title={doc ? doc.title : "Legal & Policies"}
        description={doc ? doc.summary : "Privacy, terms, refund, recruitment, safeguarding, health & safety and certification policies for Martial X × RedZone Security."}
        path={doc ? `/legal/${doc.slug}` : "/legal"}
        jsonLd={breadcrumb}
      />
      <Navbar />
      <main className="container py-16 max-w-3xl">
        <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
          <Link to="/" className="hover:text-gold">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/legal" className="hover:text-gold">Legal</Link>
        </nav>

        {!doc ? (
          <>
            <h1 className="font-display text-4xl uppercase tracking-wider mb-3">Legal &amp; Policies</h1>
            <p className="text-muted-foreground mb-10">
              The policies below govern recruitment, training, certification, payment and data handling
              across the Martial X × RedZone Security platform.
            </p>
            <ul className="grid sm:grid-cols-2 gap-4">
              {LEGAL_DOCS.map((d) => (
                <li key={d.slug}>
                  <Link
                    to={`/legal/${d.slug}`}
                    className="block glass rounded-xl p-5 hover:border-gold/40 transition-colors h-full"
                  >
                    <span className="font-display uppercase tracking-wide block mb-1">{d.title}</span>
                    <span className="text-sm text-muted-foreground">{d.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <article>
            <h1 className="font-display text-4xl uppercase tracking-wider mb-2">{doc.title}</h1>
            <p className="text-sm text-muted-foreground mb-10">Last updated {LAST_UPDATED}</p>
            {doc.sections.map((s) => (
              <section key={s.heading} className="mb-8">
                <h2 className="font-display text-xl uppercase tracking-wide text-gold mb-3">{s.heading}</h2>
                {s.body.map((p, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed mb-3">{p}</p>
                ))}
              </section>
            ))}
            <p className="text-sm text-muted-foreground border-t border-border/50 pt-6">
              Other policies: {LEGAL_DOCS.filter((d) => d.slug !== doc.slug).map((d, i) => (
                <span key={d.slug}>
                  {i > 0 && " · "}
                  <Link to={`/legal/${d.slug}`} className="hover:text-gold underline underline-offset-4">{d.title}</Link>
                </span>
              ))}
            </p>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Legal;
