import "@testing-library/jest-dom/vitest";
import {
  createElement,
  type AnchorHTMLAttributes,
  type ImgHTMLAttributes,
} from "react";
import { vi } from "vitest";

class IntersectionObserverMock {
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
}

vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => createElement("img", props),
}));
vi.mock("next/link", () => ({
  default: ({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) =>
    createElement("a", props, children),
}));
