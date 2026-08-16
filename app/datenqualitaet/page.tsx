import type { Metadata } from "next";
import { DataQualityPage } from "@/components/data-quality";

export const metadata: Metadata = {
  title: "Datenqualität",
  description: "Vorfall-Verlauf, Regelverstöße und betroffene Datensätze der FitData-Coach-Pipeline.",
};

export default function Page() {
  return <DataQualityPage />;
}
