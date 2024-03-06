import React from 'react';
import styled from 'styled-components';
//import { Page } from '../../gitops.d';
import Page from '../../weave/components/Page';
import GenericObjectViewer, { ObjectViewerProps } from './GenericObjectViewer';

function ObjectViewerPage({ className, ...props }: ObjectViewerProps) {
  return (
    <Page
      path={[
        { label: 'Explorer', url: '/explorer' },
        {
          label: `${props.kind}/${props.name}`,
        },
      ]}
    >
      <GenericObjectViewer {...props} />
    </Page>
  );
}

export default styled(ObjectViewerPage).attrs({
  className: ObjectViewerPage.name,
})``;
