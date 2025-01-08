import "jest-styled-components";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import renderer from "react-test-renderer";
import { withTheme } from "../../lib/test-utils";
import Version from "../Version";

const productName = "product name";
const versionText = "version text";
const versionHref = "https://github.com/weaveworks/weave-gitops";

describe("Version", () => {
  describe("snapshots", () => {
    it("renders plain text with version text and without version href", () => {
      const tree = renderer
        .create(
          withTheme(
            <Version productName={productName} appVersion={{ versionText }} />
          )
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    it("renders a link with version text and version href", () => {
      const tree = renderer
        .create(
          withTheme(<MemoryRouter>
            <Version
              productName={productName}
              appVersion={{ versionText, versionHref }}
            />
            </MemoryRouter>
          )
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    it("renders a dash without version text and without version href", () => {
      const tree = renderer
        .create(
          withTheme(
            <Version
              productName={productName}
              appVersion={{ versionText: "" }}
            />
          )
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    it("renders a dash as plain text without version text and with version href", () => {
      const tree = renderer
        .create(
          withTheme(
            <Version
              productName={productName}
              appVersion={{ versionText: "", versionHref }}
            />
          )
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
