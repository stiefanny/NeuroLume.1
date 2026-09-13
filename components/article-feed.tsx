"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Article={source:string;type:string;title:string;summary:string;year?:string};

export function ArticleFeed(){
  const [items,setItems]=useState<Article[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  async function fetchArticles(){const response=await fetch("/api/articles",{cache:"no-store"});const data=await response.json() as {items?:Article[];error?:string};if(!response.ok)throw new Error(data.error||"Artikel belum tersedia.");return data.items||[]}
  async function load(){setLoading(true);setError("");try{setItems(await fetchArticles())}catch(error){setError(error instanceof Error?error.message:"Artikel belum tersedia.")}finally{setLoading(false)}}
  useEffect(()=>{let active=true;void fetchArticles().then(next=>{if(active){setItems(next);setLoading(false)}}).catch(error=>{if(active){setError(error instanceof Error?error.message:"Artikel belum tersedia.");setLoading(false)}});return()=>{active=false}},[]);
  if(loading)return <div className="article-grid"><div className="article-card"><p>Memuat artikel edukasi…</p></div></div>;
  return <><div className="article-toolbar"><span>{error||"Konten artikel dimuat melalui API artikel edukasi."}</span><Button variant="outline" size="sm" onClick={()=>void load()}><RefreshCw/> Muat ulang</Button></div><section className="article-grid">{items.map(article=><details className="article-card article-details" key={`${article.source}-${article.title}`}><summary><div><span>{article.type}</span><small>{article.source}{article.year?` · ${article.year}`:""}</small></div><h2>{article.title}</h2><strong>Tekan untuk membaca ringkasan</strong></summary><div className="article-body"><p>{article.summary}</p><span>Materi ini dirangkum melalui API artikel edukasi dan bukan pengganti konsultasi tenaga kesehatan.</span></div></details>)}</section></>;
}
