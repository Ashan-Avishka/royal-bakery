import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageUploadField } from "./ImageUploadField";

const mocks = vi.hoisted(() => ({
  removeProductImage: vi.fn(),
}));

vi.mock("@/app/actions/admin/products", () => ({
  removeProductImage: mocks.removeProductImage,
}));

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:mock-preview");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function makeImageFile(name = "photo.png", type = "image/png", size = 1024) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("ImageUploadField", () => {
  it("shows the empty dropzone when there is no existing image", () => {
    render(<ImageUploadField initialImageUrl={null} />);
    expect(screen.getByText("Drag an image here, or click to browse")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Remove image" })).not.toBeInTheDocument();
  });

  it("shows the existing image and a remove button in edit mode", () => {
    render(
      <ImageUploadField
        productId="product-1"
        initialImageUrl="https://images.example.com/cake.jpg"
      />
    );
    expect(screen.getByAltText("Product image")).toHaveAttribute(
      "src",
      "https://images.example.com/cake.jpg"
    );
    expect(screen.getByRole("button", { name: "Remove image" })).toBeVisible();
  });

  it("stages a valid file and shows its preview and filename", () => {
    render(<ImageUploadField initialImageUrl={null} />);
    const input = screen.getByLabelText("Product image") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [makeImageFile()] } });

    expect(screen.getByText("photo.png")).toBeVisible();
    expect(screen.getByAltText("photo.png")).toHaveAttribute("src", "blob:mock-preview");
  });

  it("rejects a non-image file with an inline error", () => {
    render(<ImageUploadField initialImageUrl={null} />);
    const input = screen.getByLabelText("Product image") as HTMLInputElement;
    const badFile = new File(["hello"], "notes.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [badFile] } });

    expect(screen.getByRole("alert")).toHaveTextContent("Only image files are allowed.");
  });

  it("rejects a file over 5MB with an inline error", () => {
    render(<ImageUploadField initialImageUrl={null} />);
    const input = screen.getByLabelText("Product image") as HTMLInputElement;
    const bigFile = makeImageFile("big.png", "image/png", 6 * 1024 * 1024);

    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(screen.getByRole("alert")).toHaveTextContent("Image must be 5MB or smaller.");
  });

  it("removes the existing image and hides the remove button on success", async () => {
    mocks.removeProductImage.mockResolvedValue(undefined);
    render(
      <ImageUploadField productId="product-1" initialImageUrl="https://images.example.com/cake.jpg" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove image" }));

    await waitFor(() => {
      expect(mocks.removeProductImage).toHaveBeenCalledWith("product-1");
    });
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Remove image" })).not.toBeInTheDocument();
    });
    expect(screen.getByText("Drag an image here, or click to browse")).toBeVisible();
  });

  it("shows an inline error when removing the image fails", async () => {
    mocks.removeProductImage.mockRejectedValue(new Error("Failed to remove image."));
    render(
      <ImageUploadField productId="product-1" initialImageUrl="https://images.example.com/cake.jpg" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove image" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Failed to remove image.");
    expect(screen.getByRole("button", { name: "Remove image" })).toBeVisible();
  });
});
