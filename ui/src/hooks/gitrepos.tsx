import _ from 'lodash';
import React from 'react';
import { useListSources } from '../weave/hooks/sources';
import { Kind } from '../weave/lib/api/core/types.pb';
import { Source, GitRepository } from '../weave/lib/objects';
/*import { Kind,
  useListSources,
  GitRepository,
  Source,
} from '../gitops.d';*/


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
