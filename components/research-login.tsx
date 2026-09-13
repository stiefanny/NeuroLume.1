"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function safeReturnPath(value: string | null) {
  return value === "/admin" || value === "/research" ? value : "/research";
}

export function ResearchLogin() {
  const params = useSearchParams();
  const returnTo = safeReturnPath(params.get("return_to"));
  const error = params.get("error");
  return <section className="login-card"><span className="icon-box"><LockKeyhole/></span><span className="eyebrow">Akses privat</span><h1>Masuk ke area penelitian NeuroLume.</h1><p>Analisis awal dan edukasi dapat digunakan masyarakat tanpa akun. Password hanya diperlukan untuk ringkasan penelitian dan dashboard admin.</p><form className="research-login-form" method="post" action="/api/auth/login"><input type="hidden" name="return_to" value={returnTo}/><Label htmlFor="password">Password area penelitian</Label><Input id="password" name="password" type="password" minLength={8} autoComplete="current-password" required placeholder="Masukkan password"/>{error==="invalid"&&<p className="login-error">Password tidak sesuai. Periksa kembali dan coba lagi.</p>}{error==="config"&&<p className="login-error">Password dan secret belum dikonfigurasi pada Cloudflare.</p>}<div className="login-actions"><Button type="submit" size="lg">Masuk ke area penelitian</Button><Button asChild variant="outline"><Link href="/">Kembali ke analisis awal</Link></Button></div></form><div className="login-note"><ShieldCheck/><span>Akses penelitian dilindungi. Jawaban masyarakat dianalisis di perangkat dan tidak disimpan sebelum persetujuan etik.</span></div></section>;
}
