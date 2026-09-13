import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { ResearchLogin } from "@/components/research-login";

export const metadata = {
  title: "Area penelitian",
  description: "Akses privat untuk ringkasan penelitian NeuroLume.",
};

export default function LoginPage() {
  return <><SiteHeader/><main className="site-shell subpage login-page"><Suspense fallback={<section className="login-card"><p>Menyiapkan halaman masuk…</p></section>}><ResearchLogin/></Suspense></main><SiteFooter/></>;
}
