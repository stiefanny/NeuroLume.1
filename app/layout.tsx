import type { Metadata } from "next";
import "./globals.css";

export const metadata:Metadata={title:{default:"NeuroLume | Stroke Risk & Research",template:"%s · NeuroLume"},description:"Prototipe penelitian untuk pemeriksaan awal faktor risiko stroke, interpretasi model, dan edukasi kesehatan.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="id"><body>{children}</body></html>}
