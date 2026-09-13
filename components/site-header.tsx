import Link from "next/link";
import { BrainMark } from "@/components/brain-mark";

// Area penelitian sengaja tidak ditampilkan pada navigasi masyarakat.
// Halaman `/research` tetap dilindungi autentikasi server-side.
const links = [["/", "Analisis awal"], ["/education", "Edukasi"], ["/login", "Area penelitian"]];

export function SiteHeader() {
  return <header className="site-header"><div className="site-shell header-inner">
    <Link href="/" className="brand" aria-label="NeuroLume beranda"><span className="brand-mark"><BrainMark/></span><span><strong>NeuroLume</strong><small>Stroke Risk &amp; Research</small></span></Link>
    <nav aria-label="Navigasi utama">{links.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}</nav>
    <span className="research-chip"><i/> Prototipe riset</span>
  </div></header>;
}

export function SiteFooter() {
  return <footer className="site-footer"><div className="site-shell footer-grid">
    <div className="brand footer-brand"><span className="brand-mark"><BrainMark/></span><span><strong>NeuroLume</strong><small>Stroke Risk &amp; Research</small></span></div>
    <p>Alat edukasi penelitian. Bukan diagnosis, bukan perangkat medis, dan tidak menggantikan pemeriksaan tenaga kesehatan.</p>
    <div><Link href="/education">Sumber edukasi</Link></div>
  </div></footer>;
}
