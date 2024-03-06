import { IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import React, { useContext } from "react";
import styled from "styled-components";
import { AppContext } from "../contexts/AppContext";
import { FluxObject, FluxObjectNode } from "../lib/objects";
import { createYamlCommand } from "../lib/utils";
import Flex from "./Flex";
import Text from "./Text";
import { DialogYamlView } from "./YamlView";

type PRPreviewProps = { path: string; yaml: string; name: string };

export type DetailViewProps = {
  className?: string;
  object: FluxObject | FluxObjectNode | PRPreviewProps | undefined;
};

const HeaderFlex = styled(Flex)`
  margin-bottom: ${(props) => props.theme.spacing.xs};
`;

export enum AltKinds {
  Pod = "Pod",
}

const content = (object: FluxObjectNode | FluxObject | PRPreviewProps) => {
  if ("type" in object) {
    const { type, name, namespace, yaml } = object;
    switch (type) {
      // PodDetail Page - turned off for now
      // case AltKinds.Pod:
      //   return <PodPage object={object} />;
      default:
        return (
          <DialogYamlView
            header={createYamlCommand(type, name, namespace, "path" in object ? object.path as string : "")}
            yaml={yaml}
          />
        );
    }
  }
  // Handle other cases here
};

function DetailModal({ object, className }: DetailViewProps) {
  const { setDetailModal } = useContext(AppContext);
  return (
    <div className={className}>
      <HeaderFlex wide between align>
        <Text size="large" bold color="neutral30" titleHeight>
          {object?.name}
        </Text>
        <IconButton onClick={() => setDetailModal(null)} size="large">
          <Close />
        </IconButton>
      </HeaderFlex>
      {object ? content(object) : null}
    </div>
  );
}

export default styled(DetailModal).attrs({ className: DetailModal.name })`
  height: 100%;
  padding: ${(props) =>
    props.theme.spacing.small + " " + props.theme.spacing.medium};
  .MuiIconButton-root {
    color: ${(props) => props.theme.colors.neutral40};
  }
`;
