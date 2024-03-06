import { act, render, RenderResult, screen } from '@testing-library/react';
import React from 'react';
import Applications from '../';
/*import {
  AppContextProvider,
  CoreClientContextProvider,
  Kind,
  theme,
  ThemeTypes,
} from '../../../gitops.d';*/
import { ThemeTypes } from '../../../weave/contexts/AppContext';
import { Kind } from '../../../weave/lib/api/core/types.pb';
import theme from '../../../weave/lib/theme';

import {
  ApplicationsClientMock,
  defaultContexts,
  MockQueryService,
  newMockQueryService,
  withContext,
} from '../../../utils/test-utils';
import { EnterpriseClientContext } from '../../../contexts/API';

describe('Applications index test', () => {
  let wrap: (el: JSX.Element) => JSX.Element;
  let api: MockQueryService;
  const appliedTheme = theme(ThemeTypes.Light);
  beforeEach(() => {
    api = newMockQueryService();
    wrap = withContext([
      ...defaultContexts(),
      [EnterpriseClientContext.Provider, { value: { query: api } }],
    ]);
  });

  it('renders table rows', async () => {

    const objects = [
      {
        kind: Kind.Kustomization,
        name: 'my-kustomization',
        namespace: 'my-ns',
        status: 'Ready',
      },
    ];

    api.DoQueryReturns = {
      objects,
    };

    let result: RenderResult;
    await act(async () => {
      const c = wrap(<Applications />);
      result = render(c);
    });

    // @ts-ignore
    expect(result.container).toHaveTextContent('my-kustomization');
  });

  describe('snapshots', () => {
    it('loading', async () => {
      let result: RenderResult;
      await act(async () => {
        const c = wrap(<Applications />);
        result = render(c);

      });

      // @ts-ignore
      expect(result.container).toMatchSnapshot();
    });

    it('success', async () => {
      const objects = [
        {
          kind: Kind.Kustomization,
          name: 'my-kustomization',
          namespace: 'my-ns',
          status: 'Ready',
        },
      ];
      api.DoQueryReturns = {
        objects,
      };

      let result: RenderResult;
      await act(async () => {
        const c = wrap(<Applications />);
        result = render(c);
      });

      // @ts-ignore
      expect(result.container).toMatchSnapshot();
    });
  });
});
