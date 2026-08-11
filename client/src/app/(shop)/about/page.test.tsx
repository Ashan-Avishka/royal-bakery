import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AboutPage from "./page";

afterEach(cleanup);

describe("AboutPage", () => {
  it("turns the Medawala bakery story into a clear path to ordering online", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "About Royal Bakery" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "A Medawala bakery for everyday cravings and celebrations",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "The bakery counter, online",
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse the menu" })).toHaveAttribute(
      "href",
      "/products"
    );
    expect(screen.getByRole("link", { name: "Browse the menu" })).toHaveClass(
      "bg-cocoa",
      "hover:bg-cocoa-dark"
    );
    expect(screen.queryByRole("button", { name: "Browse the menu" })).not.toBeInTheDocument();
  });

  it("uses established storefront facts without unsupported process or ingredient claims", () => {
    render(<AboutPage />);

    expect(screen.getByText("Browse the menu online")).toBeInTheDocument();
    expect(screen.getByText("See current availability")).toBeInTheDocument();
    expect(screen.getByText("Order ahead")).toBeInTheDocument();
    expect(
      screen.queryByText(
        /spent years|small batches|real butter|real chocolate|no (artificial )?shortcuts|before sunrise|fresh each morning|as fresh as/i
      )
    ).not.toBeInTheDocument();
  });
});
