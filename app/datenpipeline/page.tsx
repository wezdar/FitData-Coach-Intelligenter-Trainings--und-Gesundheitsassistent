import type { Metadata } from "next";
import { PipelineLineagePage } from "@/components/pipeline-lineage";

export const metadata: Metadata = {
  title: "Datenpipeline & Lineage",
  description: "Interaktive, animierte Ansicht der FitData-Coach-Datenpipeline von Rohdaten bis Dashboard.",
};

export default function Page() {
  return <PipelineLineagePage />;
}
