const curated = [
  { source: "Kemenkes RI", type: "Dasar stroke", title: "Kenali stroke dan penyebabnya", summary: "Stroke memerlukan pengenalan faktor risiko, pemeriksaan yang tepat, dan kebiasaan hidup sehat sejak dini." },
  { source: "CDC", type: "Tanda darurat", title: "Tanda dan gejala stroke", summary: "Perubahan mendadak pada wajah, lengan, bicara, penglihatan, atau keseimbangan perlu ditangani sebagai keadaan darurat." },
  { source: "CDC", type: "Pencegahan", title: "Langkah pencegahan stroke", summary: "Pencegahan mencakup pengendalian tekanan darah, gula darah, kolesterol, penyakit jantung, kebiasaan merokok, dan aktivitas fisik." },
  { source: "WHO", type: "Konteks global", title: "Stroke dalam kesehatan global", summary: "Beban stroke menunjukkan pentingnya pencegahan dan akses terhadap pertolongan yang tepat waktu." },
];

export async function onRequestGet() {
  try {
    const query = encodeURIComponent("(stroke prevention OR stroke risk) AND FIRST_PDATE:[2022 TO 2026]");
    const response = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${query}&format=json&pageSize=6&resultType=core`, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("Europe PMC unavailable");
    const body = await response.json() as { resultList?: { result?: Array<{ title?: string; journalTitle?: string; pubYear?: string; abstractText?: string }> } };
    const research = (body.resultList?.result || []).filter(item => item.title).map(item => ({
      source: item.journalTitle || "Europe PMC", type: "Riset", title: item.title || "Publikasi stroke",
      summary: `${(item.abstractText || "Publikasi ilmiah tentang stroke dan faktor risikonya.").replace(/<[^>]+>/g, "").slice(0, 230)}…`, year: item.pubYear,
    }));
    return Response.json({ items: [...curated, ...research], provider: "Europe PMC API dan kurasi edukasi" }, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch {
    return Response.json({ items: curated, provider: "Kompilasi edukasi cadangan", fallback: true }, { headers: { "Cache-Control": "public, max-age=600" } });
  }
}
