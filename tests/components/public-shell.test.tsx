import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("AIrtistic Video Studio", () => {
  it("zeigt einen funktionalen Editor statt der gesperrten Demo", () => {
    render(<HomePage />);
    expect(screen.getByRole("main", { name: "AIrtistic Video Studio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Eigene Medien importieren/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Speichern/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /WebM exportieren/i })).toBeDisabled();
    expect(screen.getByText(/Dein Video beginnt hier/)).toBeInTheDocument();
  });
});
