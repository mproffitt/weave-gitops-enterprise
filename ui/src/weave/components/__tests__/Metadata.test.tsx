import "jest-styled-components";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import renderer from "react-test-renderer";
import { withTheme } from "../../lib/test-utils";
import Metadata from "../Metadata";

describe("Metadata", () => {
  describe("snapshots", () => {
    it("renders with data", () => {
      const tree = renderer.create(
        withTheme(
          <MemoryRouter>
          <Metadata
            metadata={[
              ["CreatedBy", "Value 4"],
              ["Version", "some version"],
              ["created-by", "Value 2"],
              ["createdBy", "Value 3"],
              ["description", "Value 1"],
              ["html", "<p><b>html</b></p>"],
              ["link-to-google", "https://google.com"],
              ["multi-lines", "This is first line\nThis is second line\n"],
            ]}
            artifactMetadata={[
              ["description", "Value 1"],
              ["html", "<p><b>html</b></p>"],
              ["link-to-google", "https://google.com"],
            ]}
            labels={[
              ["label", "label"],
              ["goose", "goose"],
            ]}
          />
          </MemoryRouter>
        )
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
    it("renders nothing without data", () => {
      const tree = renderer.create(withTheme(<Metadata />)).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
