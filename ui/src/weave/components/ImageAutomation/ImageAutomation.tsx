import React from "react";
import { useResolvedPath } from "react-router-dom";
import Flex from "../Flex";
import { routeTab } from "../KustomizationDetail";
import SubRouterTabs, { RouterTab } from "../SubRouterTabs";
import ImagePoliciesTable from "./policies/ImagePoliciesTable";
import ImageRepositoriesTable from "./repositories/ImageRepositoriesTable";
import ImageAutomationUpdatesTable from "./updates/ImageAutomationUpdatesTable";

const ImageAutomation = () => {
  const path = useResolvedPath("").pathname;

  const tabs: Array<routeTab> = [
    {
      name: "Image Repositories",
      path: `repositories`,
      component: () => {
        return <ImageRepositoriesTable />;
      },
      visible: true,
    },
    {
      name: "Image Policies",
      path: `policies`,
      component: () => {
        return <ImagePoliciesTable />;
      },
      visible: true,
    },
    {
      name: "Image Update Automations",
      path: `updates`,
      component: () => {
        return <ImageAutomationUpdatesTable />;
      },
      visible: true,
    },
  ];
  return (
    <Flex wide tall column>
      <SubRouterTabs rootPath='repositories' clearQuery>
        {tabs.map(
          (subRoute, index) =>
            subRoute.visible && (
              <RouterTab name={subRoute.name} path={subRoute.path} key={index}>
                {subRoute.component()}
              </RouterTab>
            )
        )}
      </SubRouterTabs>
    </Flex>
  );
};

export default ImageAutomation;
