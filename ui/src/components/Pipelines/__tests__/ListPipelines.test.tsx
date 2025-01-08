import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Router } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import Pipelines from '..';
import { EnterpriseClientContext } from '../../../contexts/API';
import NotificationProvider from '../../../contexts/Notifications/Provider';
import RequestContextProvider from '../../../contexts/Request';
import { muiTheme } from '../../../muiTheme';
import {
  defaultContexts,
  PipelinesClientMock,
  TestFilterableTable,
  withContext,
} from '../../../utils/test-utils';
import AppContextProvider, { ThemeTypes } from '../../../weave/contexts/AppContext';
import theme from '../../../weave/lib/theme';

const pipelines = {
  pipelines: [
    {
      name: 'podinfo',
      namespace: 'default',
      appRef: {
        apiVersion: '',
        kind: 'HelmRelease',
        name: 'podinfo',
      },
      environments: [
        {
          name: 'dev',
          targets: [
            {
              namespace: 'podinfo',
              clusterRef: {
                kind: 'GitopsCluster',
                name: 'dev',
              },
            },
          ],
        },
        {
          name: 'prod',
          targets: [
            {
              namespace: 'podinfo',
              clusterRef: {
                kind: 'GitopsCluster',
                name: 'prod',
              },
            },
          ],
        },
      ],
      targets: [],
    },
    {
      name: 'test pipline 2',
      namespace: 'flux-system',
      appRef: {
        apiVersion: '',
        kind: 'HelmRelease',
        name: 'podinfo 2',
      },
      environments: [
        {
          name: 'dev',
          targets: [
            {
              namespace: 'podinfo',
              clusterRef: {
                kind: 'GitopsCluster',
                name: 'dev',
              },
            },
          ],
        },
      ],
      targets: [],
    },
  ],
};
describe('ListPipelines', () => {
  let wrap: (el: JSX.Element) => JSX.Element;
  let api: PipelinesClientMock;

  beforeEach(() => {
    api = new PipelinesClientMock();
    wrap = withContext([
      ...defaultContexts(),
      [EnterpriseClientContext.Provider, { value: { pipelines: api } }],
    ]);
  });

  it('renders a list of pipelines', async () => {
    const filterTable = new TestFilterableTable('pipelines-list', fireEvent);

    api.ListPipelinesReturns = pipelines;
    const pls = pipelines.pipelines;

    await act(async () => {
      const c = wrap(<Pipelines />);
      render(c);
    });

    expect(await screen.findByText('Pipelines')).toBeTruthy();

    // Check rendered Column header
    filterTable.testRenderTable(
      [
        'Pipeline Name',
        'Pipeline Namespace',
        'Application',
        'Type',
        'Environments',
      ],
      pls.length,
    );

    const search = 'test pipline 2';
    const searchedRows = pls
      .filter(e => e.name === search)
      .map(e => [
        e.name,
        e.namespace,
        e.appRef.name,
        e.appRef.kind,
        e.environments.reduce((prev, nex) => {
          return prev + nex.name;
        }, ''),
      ]);

    filterTable.testSearchTableByValue(search, searchedRows);
    filterTable.clearSearchByVal(search);
  });

  it('create pipeline btn', async () => {
    const history = createMemoryHistory();
    api.ListPipelinesReturns = pipelines;
    const appliedTheme = theme(ThemeTypes.Light);

    await act(async () => {
      const c = (
        <ThemeProvider theme={appliedTheme}>
          <MuiThemeProvider theme={muiTheme(appliedTheme.colors, ThemeTypes.Light)}>
          <Router location={""} navigator={history}>
            <AppContextProvider footer={<></>}>
              <QueryClientProvider client={new QueryClient()}>
                <RequestContextProvider fetch={() => new Promise(accept => accept({} as any))}>
                  <NotificationProvider>
                    <Pipelines />
                  </NotificationProvider>
                </RequestContextProvider>
              </QueryClientProvider>
            </AppContextProvider>
          </Router>
          </MuiThemeProvider>
        </ThemeProvider>
      );
      render(c);
    });
    expect(await screen.findByText('CREATE A PIPELINE')).toBeTruthy();

    await act(async () => {
      const createBtn = await screen.findByTestId('create-pipeline');
      fireEvent.click(createBtn);
    });

    const expectedUrl = `${history.location.pathname}${history.location.search}`;
    expect(expectedUrl).toEqual(
      '/templates?filters=templateType%3A%20pipeline',
    );
  });
});

describe('Auth redirect', () => {
  let wrap: (el: JSX.Element) => JSX.Element;
  let api: PipelinesClientMock;
  beforeEach(() => {
    api = new PipelinesClientMock();
    wrap = withContext([
      ...defaultContexts(),
      [EnterpriseClientContext.Provider, { value: { pipelines: api } }],
    ]);
    jest.spyOn(console, 'error').mockImplementationOnce(() => {
      return;
    });
  });
  const mockResponse = jest.fn();
  Object.defineProperty(window, 'location', {
    value: {
      hash: {
        endsWith: mockResponse,
        includes: mockResponse,
      },
      assign: mockResponse,
    },
    writable: true,
  });
  it('auth redirect to login', async () => {
    api.ErrorRef = { code: 401, message: 'Auth error' };
    await act(async () => {
      const c = wrap(<Pipelines />);
      render(c);
    });
    expect(window.location.href).toContain('/sign_in');
  });
});
