import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, MapPin, Search, Shield, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { NIGERIA_STATES } from '@/data/nigeria-hubs';

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function StateLgaHubs() {
  const { state } = useParams<{ state?: string }>();
  const [query, setQuery] = useState('');
  const selected = state ? NIGERIA_STATES.find((item) => item.slug === state) : undefined;
  const states = useMemo(() => NIGERIA_STATES.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()) || item.lgAs.some((lga) => lga.toLowerCase().includes(query.toLowerCase()))), [query]);

  if (state && !selected) return <div className="min-h-screen bg-[#090909] text-white flex items-center justify-center p-6"><div><h1 className="text-3xl font-bold">State not found</h1><Link className="text-amber-400" to="/state/lga/hubs">Return to hub directory</Link></div></div>;

  const title = selected ? `${selected.name} LGA & Hub Network` : 'Nigeria State, LGA & Hub Network';
  const description = selected ? `Recruitment, orientation and deployment hubs across ${selected.name}.` : 'Find recruitment, orientation and deployment hubs across all 36 Nigerian states and the FCT.';

  return <>
    <Helmet><title>{title} | ResoFlex™</title><meta name="description" content={description} /></Helmet>
    <main className="min-h-screen bg-[#090909] text-white">
      <header className="border-b border-white/10 bg-black/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="font-semibold tracking-wide">RESOFLEX™ <span className="text-amber-400">INDUSTRIAL SQUAD</span></Link>
          <Link to="/apply" className="rounded-full border border-amber-400/50 px-4 py-2 text-sm hover:bg-amber-400 hover:text-black transition">Apply</Link>
        </div>
      </header>
      <section className="max-w-6xl mx-auto px-5 pt-14 pb-8">
        <div className="max-w-3xl">
          <p className="uppercase tracking-[0.25em] text-xs text-amber-400 mb-4">National deployment network</p>
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight">{title}</h1>
          <p className="mt-5 text-white/65 text-lg">{description} Select a state, then an LGA to view its hub pathway.</p>
        </div>
        <div className="mt-8 relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search state or LGA" className="w-full rounded-2xl bg-white/5 border border-white/10 py-4 pl-12 pr-4 outline-none focus:border-amber-400/60" />
        </div>
      </section>
      {selected ? <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {selected.lgAs.map((lga) => <Link key={lga} to={`/state/${selected.slug}/lga/hubs/${slugify(lga)}`} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 hover:border-amber-400/50 transition">
            <div className="flex items-start justify-between gap-4"><MapPin className="w-5 h-5 text-amber-400" /><ArrowRight className="w-4 h-4 text-white/30 group-hover:text-amber-400 transition" /></div>
            <h2 className="mt-5 font-medium">{lga}</h2><p className="mt-1 text-sm text-white/45">View hub pathway</p>
          </Link>)}
        </div>
      </section> : <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {states.map((item) => <Link key={item.slug} to={`/state/${item.slug}/lga/hubs`} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 hover:border-amber-400/50 transition">
            <div className="flex items-center justify-between"><span className="text-xs uppercase tracking-widest text-amber-400">{item.slug === 'fct' ? 'FCT' : 'State'}</span><ArrowRight className="w-4 h-4 text-white/30 group-hover:text-amber-400" /></div>
            <h2 className="mt-5 text-xl font-medium">{item.name}</h2><p className="mt-1 text-sm text-white/45">{item.lgAs.length} LGAs listed · Hub directory</p>
          </Link>)}
        </div>
      </section>}
      <section className="border-t border-white/10 bg-white/[0.02]"><div className="max-w-6xl mx-auto px-5 py-10 grid md:grid-cols-3 gap-5 text-sm text-white/60"><div className="flex gap-3"><Users className="text-amber-400 shrink-0" />Recruitment and onboarding by location</div><div className="flex gap-3"><Shield className="text-amber-400 shrink-0" />Verification and orientation pathways</div><div className="flex gap-3"><MapPin className="text-amber-400 shrink-0" />State → LGA → Hub navigation</div></div></section>
    </main>
  </>;
}
