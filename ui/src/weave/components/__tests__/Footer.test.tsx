import { RenderOptions, render, screen } from "@testing-library/react";
import "jest-canvas-mock";
import "jest-styled-components";
import React from "react";
import { act } from "react-dom/test-utils";
import {
  createCoreMockClient,
  withContext,
  withTheme,
} from "../../lib/test-utils";
import Footer from "../Footer";

describe("Footer", () => {
  let container: HTMLDivElement | RenderOptions<typeof import("@testing-library/dom/types/queries"), HTMLElement, HTMLElement> | null;
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  afterEach(() => {
    if (container !== null) {
      document.body.removeChild(container as Node);
      container = null;
    }
  });

  describe("snapshots", () => {
    it("default", async () => {
      await act(async () => {
        render(
          withTheme(
            withContext(<Footer />, "/", {
              api: createCoreMockClient({
                GetVersion: () => ({
                  semver: "v0.0.1",
                  branch: "mybranch",
                  commit: "123abcd",
                }),
              }),
            })
          ),
          container as unknown as RenderOptions<typeof import("@testing-library/dom/types/queries"), HTMLElement, HTMLElement>
        );
      });

      const footer = screen.getByRole("contentinfo");
      expect(footer).toMatchSnapshot();
    });
    it("no api version", async () => {
      await act(async () => {
        render(
          withTheme(
            withContext(<Footer />, "/", {
              api: createCoreMockClient({
                GetVersion: () => ({}),
              }),
            })
          ),
          container as unknown as RenderOptions<typeof import("@testing-library/dom/types/queries"), HTMLElement, HTMLElement>
        );
      });

      const footer = screen.getByRole("contentinfo");
      expect(footer).toMatchSnapshot();
    });
  });
});
