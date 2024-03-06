import { render, screen } from "@testing-library/react";
import * as React from "react";
import { withContext } from "../../lib/test-utils";
import useNavigation from "../navigation";

describe("useNavigation", () => {
  let container: HTMLDivElement | null;
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
  });

  it("displays the current page", () => {
    const id = "custom-element";
    const myPage = "my_page";
    const TestComponent : React.FC = () => {
      const { currentPage } = useNavigation();

      return <p data-testid={id}>{currentPage}</p>;
    };

    render(withContext(TestComponent, `/${myPage}`, {}));
    expect(screen.getByTestId(id).textContent).toEqual(`/${myPage}`);
  });
});
