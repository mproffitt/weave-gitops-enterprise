import React, { memo, useState } from "react";
import styled from "styled-components";

type Props = {
  className?: string;
  id?: string;
  column?: boolean;
  align?: boolean;
  alignItems?: string;
  height?: string;
  between?: boolean;
  center?: boolean;
  wide?: boolean;
  wrap?: boolean;
  shadow?: boolean;
  tall?: boolean;
  start?: boolean;
  end?: boolean;
  gap?: string;
  row?: boolean;
  clusterAuth?: boolean;
  onMouseEnter?: React.ReactEventHandler;
  onMouseLeave?: React.ReactEventHandler;
  "data-testid"?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

const Flex = memo(function Flex({
  className,
  onMouseEnter,
  onMouseLeave,
  "data-testid": dataTestId,
  children,
} : Props) {
  return (
    <>
      <div
        data-testid={dataTestId}
        className={className}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </div>
    </>
  );
});

export default styled(Flex).attrs({ className: Flex.name })`
  display: flex;
  flex-direction: ${({ column }) => (column ? "column" : "row")};
  align-items: ${({ align, alignItems }) =>
    alignItems ? alignItems : align ? "center" : "start"};
  ${({ gap }) => gap && `gap: ${gap}px`};
  ${({ tall }) => tall && `height: 100%`};
  ${({ wide }) => wide && "width: 100%"};
  ${({ wrap }) => wrap && "flex-wrap: wrap"};
  ${({ start }) => start && "justify-content: flex-start"};
  ${({ end }) => end && "justify-content: flex-end"};
  ${({ between }) => between && "justify-content: space-between"};
  ${({ center }) => center && "justify-content: center"};
  ${({ shadow }) => shadow && "box-shadow: 5px 10px 50px 3px #0000001a"};
`;
