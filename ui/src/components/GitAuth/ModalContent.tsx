import {
  Button,
  CopyToClipboard,
  Flex,
  Icon,
  IconType,
} from '@choclab/weave-gitops';
import styled from 'styled-components';
import { GetGithubDeviceCodeResponse } from '../../api/gitauth/gitauth.pb';
import { useGetGithubAuthStatus } from '../../contexts/GitAuth';

const Pad = styled(Flex)`
  padding: 8px 0;
`;

interface Props {
  codeRes: GetGithubDeviceCodeResponse;
  onSuccess: (token: string) => void;
  className?: string;
}

const ModalContent = styled(({ codeRes, onSuccess, className }: Props) => {
  const { data } = useGetGithubAuthStatus(codeRes);
  if (data && data.accessToken) {
    onSuccess(data.accessToken);
  }
  return (
    <div className={className}>
      <Pad wide center>
        <Flex align data-testid="github-code-container">
          <p className="code-text" data-testid="github-code">
            {codeRes.userCode}
          </p>
          <CopyToClipboard
            value={codeRes.userCode as string}
            className="copy-code"
          />
        </Flex>
      </Pad>
      <Pad wide center>
        <a target="_blank" href={codeRes.validationUri} rel="noreferrer">
          <Button
            type="button"
            startIcon={<Icon size="base" type={IconType.ExternalTab} />}
          >
            AUTHORIZE GITHUB ACCESS
          </Button>
        </a>
      </Pad>
      <Pad wide center>
        <div>Waiting for authorization to be completed...</div>
      </Pad>
    </div>
  );
})`
  .copy-code {
    border-radius: 4px;
    border: none;
    padding: 5px;
    min-width: auto;
    border-radius: 50%;
    &:hover {
      border: none;
    }
  }
  .code-text {
    font-size: ${props => props.theme.fontSizes.extraLarge};
    margin: 0px 5px 0px 0px;
  }
`;
export default ModalContent;
