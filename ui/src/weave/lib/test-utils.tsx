import { ThemeProvider as MuiThemeProvider } from "@mui/material";
import { createMemoryHistory } from "history";
import _ from "lodash";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { Router } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import AppContextProvider, {
  AppProps,
  ThemeTypes,
} from "../contexts/AppContext";
import { CoreClientContext } from "../contexts/CoreClientContext";
import {
  Core,
  GetChildObjectsRequest,
  GetChildObjectsResponse,
  GetReconciledObjectsRequest,
  GetReconciledObjectsResponse,
  GetVersionRequest,
  GetVersionResponse,
  ListObjectsRequest,
  ListObjectsResponse,
} from "./api/core/core.pb";
import theme, { muiTheme } from "./theme";
import { RequestError } from "./types";
import { jsx } from "@emotion/react";
export type CoreOverrides = {
  GetChildObjects?: (req: GetChildObjectsRequest) => GetChildObjectsResponse;
  GetReconciledObjects?: (
    req: GetReconciledObjectsRequest
  ) => GetReconciledObjectsResponse;
  GetVersion?: (req: GetVersionRequest) => GetVersionResponse;
  ListObjects?: (req: ListObjectsRequest) => ListObjectsResponse;
};

export const createCoreMockClient = (
  ovr: CoreOverrides,
  error?: RequestError
): typeof Core => {
  const promisified = _.reduce(
    ovr,
    (result: { [key: string]: any }, handlerFn: any, method: string) => {
      result[method as string] = (req: GetChildObjectsRequest & GetReconciledObjectsRequest & ListObjectsRequest) => {
        if (error) {
          return new Promise((_, reject) => reject(error));
        }
        return new Promise((accept) => {
          if (handlerFn) {
            accept(handlerFn(req) as any);
          }
        });
      };

      return result;
    },
    {}
  );

  return promisified as typeof Core;
};

export function withTheme(element: any, mode: ThemeTypes = ThemeTypes.Light) {
  const appliedTheme = theme(mode);
  return (
    <ThemeProvider theme={appliedTheme}>
      <MuiThemeProvider theme={muiTheme(appliedTheme.colors, mode)}>
        {element}
      </MuiThemeProvider>
    </ThemeProvider>
  );
}

type TestContextProps = AppProps & {
  api?: typeof Core;
  featureFlags?: { [key: string]: string };
};

export function withContext(
  TestComponent: any,
  url: string,
  { api, featureFlags, ...appProps }: TestContextProps
) {
  const history = createMemoryHistory({ initialEntries: [url] });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const isElement = React.isValidElement(TestComponent);
  window.matchMedia = jest.fn();
  //@ts-ignore
  window.matchMedia.mockReturnValue({ matches: false });
  return (
    <Router location={url} navigator={history}>
      <AppContextProvider footer={<></>} {...appProps}>
        <QueryClientProvider client={queryClient}>
          <CoreClientContext.Provider
            value={{ api: api!, featureFlags: featureFlags || {} }}
          >
            {isElement ? TestComponent : <TestComponent />}
          </CoreClientContext.Provider>
        </QueryClientProvider>
      </AppContextProvider>
    </Router>
  );
}
