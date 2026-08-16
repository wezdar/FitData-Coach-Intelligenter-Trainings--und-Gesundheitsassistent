import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, SectionHeader } from "@/components/ui";

describe("shared interface components", () => {
  it("renders German section labels accessibly", () => {
    render(<SectionHeader eyebrow="Letzte 7 Tage" title="Deine Aktivität" action={<Badge tone="lime">Aktuell</Badge>} />);
    expect(screen.getByRole("heading", { name: "Deine Aktivität" })).toBeInTheDocument();
    expect(screen.getByText("Letzte 7 Tage")).toBeInTheDocument();
    expect(screen.getByText("Aktuell")).toBeInTheDocument();
  });
});
