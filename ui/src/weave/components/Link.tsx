import * as React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import styled from "styled-components";
import { isAllowedLink, isHTTP } from "../lib/utils";
import Spacer from "./Spacer";
import Text, { TextProps } from "./Text";

type Props = {
  className?: string;
  to?: string;
  innerRef?: any;
  children?: any;
  href?: any;
  newTab?: boolean;
  textProps?: TextProps;
  icon?: JSX.Element;
  onClick?: (ev: any) => void;
  onMouseEnter?: React.EventHandler<React.SyntheticEvent>;
  onMouseLeave?: React.EventHandler<React.SyntheticEvent>;
  as?: any;
};

const SpacedIcon = ({ icon }: { icon: JSX.Element }) => (
  <>
    <Spacer padding="xxs" />
    {icon}
    <Spacer padding="xs" />
  </>
);

function Link({
  children,
  href,
  className,
  to = "",
  newTab,
  onClick,
  textProps,
  icon,
  onMouseEnter,
  onMouseLeave,
  ...props
}: Props) {
  let location = useLocation();
  if ((href && !isAllowedLink(href)) || (!href && !to)) {
    return (
      <Text className={className} {...textProps}>
        {children}
      </Text>
    );
  }

  const txt = (
    <Text color="primary" {...textProps}>
      {children}
    </Text>
  );

  if (href) {
    return (
      <a
        className={className}
        href={href}
        target={newTab ? "_blank" : ""}
        rel="noreferrer"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {icon && <SpacedIcon icon={icon} />}
        {txt}
      </a>
    );
  }

  // The old react-router-dom v5 behaviour of path relative routing doesn't seem
  // to be supported in v6. This meant absolute URLs were rendered as is and not
  // made relative to the current domain.
  if (isHTTP(to) || !isAllowedLink(to)) {
    to = new URL("", window.origin + location.pathname + to).toString();
  }

  return (
    <RouterLink
      onClick={onClick}
      className={className}
      to={to}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      relative="path"
      {...props}
    >
      {icon && <SpacedIcon icon={icon} />}
      {txt}
    </RouterLink>
  );
}

export default styled(Link).attrs({ className: Link.name })`
  text-decoration: none;
`;
