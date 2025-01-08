import * as React from "react";
import styled from "styled-components";
import { useFeatureFlags } from "../hooks/featureflags";
import { Kind } from "../lib/api/core/types.pb";
import { HelmChart } from "../lib/objects";
import ClusterDashboardLink from "./ClusterDashboardLink";
import { InfoField } from "./InfoList";
import Interval from "./Interval";
import SourceDetail from "./SourceDetail";
import Timestamp from "./Timestamp";

type Props = {
  className?: string;
  helmChart: HelmChart;
  customActions?: JSX.Element[];
};

function HelmChartDetail({ className, helmChart, customActions }: Props) {
  const { isFlagEnabled } = useFeatureFlags();

  const tenancyInfo: InfoField[] =
    isFlagEnabled("WEAVE_GITOPS_FEATURE_TENANCY") && helmChart.tenant
      ? [["Tenant", helmChart.tenant]]
      : [];
  const clusterInfo: InfoField[] = isFlagEnabled("WEAVE_GITOPS_FEATURE_CLUSTER")
    ? [
        [
          "Cluster",
          <ClusterDashboardLink clusterName={helmChart?.clusterName} />,
        ],
      ]
    : [];

  return (
    <SourceDetail
      type={Kind.HelmChart}
      className={className}
      source={helmChart}
      customActions={customActions}
      info={[
        ["Kind", Kind.HelmChart],
        ["Chart", helmChart.chart],
        ["Version", helmChart.version],
        ["Current Revision", helmChart.revision],
        ["Ref", helmChart.sourceRef?.name],
        ["Last Updated", <Timestamp time={helmChart.lastUpdatedAt} />],
        ["Interval", <Interval interval={helmChart.interval} />],
        ...clusterInfo,
        ["Namespace", helmChart.namespace],
        ...tenancyInfo,
      ]}
    />
  );
}

export default styled(HelmChartDetail).attrs({
  className: HelmChartDetail.name,
})``;
