import React from "react";
import styled from "styled-components";
import { useLinkResolver } from "../contexts/LinkResolverContext";
import Link from "./Link";
import Text from "./Text";

function ClusterDashboardLink({ clusterName }: { className?: string, clusterName: string }) {
  const resolver = useLinkResolver();
  const resolved = resolver && resolver("ClusterDashboard", { clusterName });

  // TODO: This is opinionated as in GS CAPI the management cluster is not
  // called "management" but is inferred from a CAPI cluster defined inside itself
  // This means we should infer the MC cluster name from elsewhere
  if (resolved && clusterName != "management") {
    return <Link to={resolved}>{clusterName}</Link>;
  }

  return <Text>{clusterName}</Text>;
}
export default styled(ClusterDashboardLink).attrs({ className: ClusterDashboardLink.name })``;
