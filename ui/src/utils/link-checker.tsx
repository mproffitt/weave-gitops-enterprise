import { isAllowedLink } from '@choclab/weave-gitops';

export const openLinkHandler = (url: string) => {
  if (!isAllowedLink(url)) {
    return () => {
      return;
    };
  }
  return () => window.open(url, '_blank', 'noopener,noreferrer');
};
