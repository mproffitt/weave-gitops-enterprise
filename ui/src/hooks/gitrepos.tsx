import { Kind, useListSources } from '@choclab/weave-gitops';
import { GitRepository, Source } from '@choclab/weave-gitops/ui/lib/objects';
import _ from 'lodash';
import React from 'react';


export const getGitRepos = (sources: Source[] | undefined) =>
  _.orderBy(
    _.uniqBy(
      _.filter(
        sources,
        (item): item is GitRepository => item.type === Kind.GitRepository,
      ),
      repo => repo?.obj?.spec?.url,
    ),
    ['name'],
    ['asc'],
  );

export const useGitRepos = () => {
  const { data, error, isLoading } = useListSources('', '', { retry: false });
  const gitRepos = React.useMemo(
    () => getGitRepos(data?.result),
    [data?.result],
  );

  return { gitRepos, error, isLoading };
};
