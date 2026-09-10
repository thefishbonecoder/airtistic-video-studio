import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("öffentliche Studio-Oberfläche", () => {
  it("zeigt das gesperrte Studio und die reine Mobilansicht", () => {
    render(<HomePage />);

    expect(screen.getByLabelText("AIrtistic Video Studio")).toHaveAttribute(
      "data-locked",
      "true",
    );
    expect(
      screen.getByText(
        "Das AIrtistic Video Studio ist für Laptop und Desktop verfügbar.",
      ),
    ).toBeInTheDocument();
  });
});
