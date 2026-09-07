import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, MapPin, Search, Shield, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { NIGERIA_STATES } from '@/data/nigeria-hubs';
import { MARTIAL_MEDIA } from '@/data/martial-media';

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function StateLgaHubs() {
  const { state, lga } = useParams<{ state?: string; lga?: string }>();
  const [query, setQuery] = useState('');
  const selected = state ? NIGERIA_STATES.find((item) => item.slug === state) : undefined;
  const selectedLga = selected?.lgAs.find((item) => slugify(item) === lga);
  const states = useMemo(() => NIGERIA_STATES.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()) || item.lgAs.some((itemLga) => itemLga.toLowerCase().includes(query.toLowerCase()))), [query]);

  if (state && !selected) return <div className="min-h-screen bg-[#090909] text-white flex items-center justify-center p-6"><div><h1 className="text-3xl font-bold">State not found</h1><Link className="text-amber-400" to="/state/lga/hubs">Return to hub directory</Link></div></div>;
  if (selected && lga && !selectedLga) return <div className="min-h-screen bg-[#090909] text-white flex items-center justify-center p-6"><div><h1 className="text-3xl font-bold">LGA not found</h1><Link className="text-amber-400" to={`/state/${selected.slug}/lga/hubs`}>Return to {selected.name}</Link></div></div>;

  const title = selectedLga ? `${selectedLga} Hub Pathway · ${selected!.name}` : selected ? `${selected.name} LGA & Hub Network` : 'Nigeria State, LGA & Hub Network';
  const description = selectedLga ? `Recruitment, orientation and deployment pathway for ${selectedLga}, ${selected!.name}.` : selected ? `Recruitment, orientation and deployment hubs across ${selected.name}.` : 'Find recruitment, orientation and deployment hubs across all 36 Nigerian states and the FCT.';

  return <>
    <Helmet>
      <title>{title} | ResoFlex™</title>
      <meta name="description" content={description} />
      <link rel="preload" as="image" href={MARTIAL_MEDIA.bgHero} fetchPriority="high" />
    </Helmet>
    <main className="min-h-screen bg-[#090909] text-white">
      <section className="relative min-h-[430px] overflow-hidden border-b border-white/10">
        <img src={MARTIAL_MEDIA.bgHero} alt="" aria-hidden="true" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-70" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = MARTIAL_MEDIA.bgHeroAlt; }} />
        <video className="absolute inset-0 h-full w-full object-cover opacity-55" autoPlay muted loop playsInline preload="metadata" poster={MARTIAL_MEDIA.bgHero} aria-hidden="true">
          <source src={MARTIAL_MEDIA.heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
        <header className="relative z-10 border-b border-white/10 bg-black/35 backdrop-blur-xl sticky top-0">
          <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
            <Link to="/" className="font-semibold tracking-wide">RESOFLEX™ <span className="text-amber-400">INDUSTRIAL SQUAD</span></Link>
            <Link to="/apply" className="rounded-full border border-amber-400/50 px-4 py-2 text-sm hover:bg-amber-400 hover:text-black transition">Apply</Link>
          </div>
        </header>
        <div className="relative z-10 max-w-6xl mx-auto px-5 pt-16 pb-14">
          <p className="uppercase tracking-[0.25em] text-xs text-amber-400 mb-4">National deployment network</p>
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight max-w-4xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-white/75 text-lg">{description}</p>
          {selectedLga && <Link to={`/state/${selected!.slug}/lga/hubs`} className="inline-flex items-center gap-2 mt-7 text-sm text-amber-300">← All {selected!.name} LGAs</Link>}
        </div>
      </section>

      {!selectedLga && <section className="max-w-6xl mx-auto px-5 py-8">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search state or LGA" className="w-full rounded-2xl bg-white/5 border border-white/10 py-4 pl-12 pr-4 outline-none focus:border-amber-400/60" />
        </div>
      </section>}

      {selectedLga ? <section className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ['Recruitment', 'Complete profile verification and select an available track.'],
            ['Orientation', 'Receive the location-specific orientation pathway after selection.'],
            ['Deployment', 'Role assignment and deployment follow verification and final selection.'],
          ].map(([heading, copy]) => <article key={heading} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><p className="text-amber-400 text-xs uppercase tracking-widest">{heading}</p><p className="mt-3 text-white/65 leading-7">{copy}</p></article>)}
        </div>
        <div className="mt-8 rounded-3xl border border-amber-400/20 bg-amber-400/[0.05] p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div><h2 className="text-xl font-semibold">Start the {selectedLga} pathway</h2><p className="mt-2 text-white/55">Apply once; the portal routes your onboarding journey by location.</p></div>
          <Link to="/apply" className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 text-black px-6 py-3 font-semibold">Apply now <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section> : selected ? <section className="max-w-6xl mx-auto px-5 pb-16"><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{selected.lgAs.map((itemLga) => <Link key={itemLga} to={`/state/${selected.slug}/lga/hubs/${slugify(itemLga)}`} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 hover:border-amber-400/50 transition"><div className="flex items-start justify-between gap-4"><MapPin className="w-5 h-5 text-amber-400" /><ArrowRight className="w-4 h-4 text-white/30 group-hover:text-amber-400 transition" /></div><h2 className="mt-5 font-medium">{itemLga}</h2><p className="mt-1 text-sm text-white/45">Open dynamic hub pathway</p></Link>)}</div></section> : <section className="max-w-6xl mx-auto px-5 pb-16"><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{states.map((item) => <Link key={item.slug} to={`/state/${item.slug}/lga/hubs`} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 hover:border-amber-400/50 transition"><div className="flex items-center justify-between"><span className="text-xs uppercase tracking-widest text-amber-400">{item.slug === 'fct' ? 'FCT' : 'State'}</span><ArrowRight className="w-4 h-4 text-white/30 group-hover:text-amber-400" /></div><h2 className="mt-5 text-xl font-medium">{item.name}</h2><p className="mt-1 text-sm text-white/45">{item.lgAs.length} LGAs listed · Hub directory</p></Link>)}</div></section>}

      <section className="border-t border-white/10 bg-white/[0.02]"><div className="max-w-6xl mx-auto px-5 py-10 grid md:grid-cols-3 gap-5 text-sm text-white/60"><div className="flex gap-3"><Users className="text-amber-400 shrink-0" />Recruitment and onboarding by location</div><div className="flex gap-3"><Shield className="text-amber-400 shrink-0" />Verification and orientation pathways</div><div className="flex gap-3"><MapPin className="text-amber-400 shrink-0" />State → LGA → Hub navigation</div></div></section>
    </main>
  </>;
}
