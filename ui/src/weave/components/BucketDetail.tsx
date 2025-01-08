import * as React from "react";
import styled from "styled-components";
import { useFeatureFlags } from "../hooks/featureflags";
import { Kind } from "../lib/api/core/types.pb";
import { Bucket } from "../lib/objects";
import ClusterDashboardLink from "./ClusterDashboardLink";
import { InfoField } from "./InfoList";
import Interval from "./Interval";
import SourceDetail from "./SourceDetail";
import Timestamp from "./Timestamp";

type Props = {
  className?: string;
  bucket: Bucket | undefined;
  customActions?: JSX.Element[];
};

function BucketDetail({ className, bucket, customActions }: Props) {
  const { isFlagEnabled } = useFeatureFlags();

  const tenancyInfo: InfoField[] =
    isFlagEnabled("WEAVE_GITOPS_FEATURE_TENANCY") && bucket?.tenant
      ? [["Tenant", bucket.tenant]]
      : [];

  const clusterInfo: InfoField[] = isFlagEnabled("WEAVE_GITOPS_FEATURE_CLUSTER")
    ? [["Cluster", <ClusterDashboardLink clusterName={bucket?.clusterName || ''} />]]
    : [];

  return (
    <SourceDetail
      className={className}
      type={Kind.Bucket}
      source={bucket as Bucket}
      customActions={customActions}
      info={[
        ["Kind", Kind.Bucket],
        ["Endpoint", bucket?.endpoint],
        ["Bucket Name", bucket?.name],
        ["Last Updated", <Timestamp time={bucket?.lastUpdatedAt || ""} />],
        ["Interval", <Interval interval={bucket?.interval || null} />],
        ...clusterInfo,
        ["Namespace", bucket?.namespace],
        ...tenancyInfo,
      ]}
    />
  );
}

export default styled(BucketDetail).attrs({ className: BucketDetail.name })``;
