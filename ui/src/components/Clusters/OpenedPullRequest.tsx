import { createStyles, makeStyles } from '@material-ui/core';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import {
  Button,
  GitRepository,
  Icon,
  IconType,
} from '@choclab/weave-gitops';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { GetConfigResponse } from '../../cluster-services/cluster_services.pb';
import { useListConfigContext } from '../../contexts/ListConfig';
import useConfig from '../../hooks/config';
import { useGitRepos } from '../../hooks/gitrepos';
import { openLinkHandler } from '../../utils/link-checker';
import {
  bitbucketReposToHttpsUrl,
  getDefaultGitRepo,
  getProvider,
  getRepositoryUrl,
} from '../Templates/Form/utils';

const useStyles = makeStyles(() =>
  createStyles({
    optionsButton: {
      marginRight: '0px',
    },
    externalLink: {
      marginRight: '5px',
    },
  }),
);

export function getPullRequestUrl(
  gitRepo: GitRepository,
  config: GetConfigResponse,
) {
  const provider = getProvider(gitRepo, config);

  const repoUrl = getRepositoryUrl(gitRepo);

  // remove any trailing .git
  const baseUrl = repoUrl.replace(/\.git$/, '');

  if (provider === 'gitlab') {
    return baseUrl + '/-/merge_requests';
  }

  if (provider === 'bitbucket-server') {
    const url = bitbucketReposToHttpsUrl(baseUrl);

    return url + '/pull-requests';
  }

  if (provider === 'azure-devops') {
    return baseUrl + '/pullrequests?_a=active';
  }

  // github is the default
  return baseUrl + '/pulls';
}

export default function OpenedPullRequest() {
  const [open, setOpen] = React.useState(false);
  const configResponse = useListConfigContext();
  const mgCluster = configResponse?.data?.managementClusterName;

  const anchorRef = React.useRef<HTMLDivElement>(null);

  const { gitRepos, isLoading: reposLoading } = useGitRepos();

  const Classes = useStyles();

  const { data: config, isLoading } = useConfig();

  const options = useMemo(
    () =>
      !config
        ? ([] as string[])
        : _.uniq(gitRepos.map(repo => getPullRequestUrl(repo, config))),
    [gitRepos, config],
  );

  if (reposLoading || isLoading) {
    return null;
  }

  if (!config) {
    return <div>Config not found</div>;
  }

  if (!gitRepos || gitRepos.length === 0) {
    return <div>Git Repos not found</div>;
  }

  const defaultRepo = getDefaultGitRepo(gitRepos, mgCluster);

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen);
  };

  const handleClose = (event: React.MouseEvent<Document, MouseEvent>) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  return (
    <>
      <ButtonGroup variant="outlined" ref={anchorRef} aria-label="split button">
        <Button
          className={Classes.optionsButton}
          color="primary"
          onClick={openLinkHandler(
            getPullRequestUrl(defaultRepo, config) || '',
          )}
          disabled={!options.length}
        >
          <>
            <Icon
              className={Classes.externalLink}
              type={IconType.ExternalTab}
              size="base"
            />
            VIEW OPEN PULL REQUESTS
          </>
        </Button>
        <Button
          size="small"
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="menu"
          onClick={handleToggle}
          color="primary"
          disabled={options.length === 0}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu">
                  {options.map((option, index) => (
                    <MenuItem key={option} onClick={openLinkHandler(option)}>
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}
