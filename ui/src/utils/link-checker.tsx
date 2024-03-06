//import { isAllowedLink } from '../gitops.d';

import { isAllowedLink } from "../weave/lib/utils";

export const openLinkHandler = (url: string) => {
  if (!isAllowedLink(url)) {
    return () => {
      return;
    };
  }
  return () => window.open(url, '_blank', 'noopener,noreferrer');
};
