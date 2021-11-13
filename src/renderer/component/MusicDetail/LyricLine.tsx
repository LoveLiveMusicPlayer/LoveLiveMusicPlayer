import React from 'react';
import styled, {css} from 'styled-components';

const Style = styled.div<{
    active: boolean;
}>`
  padding: 4px 10px;
  font-size: 14px;
  ${({active}) => css`
    color: ${active ? 'lightgreen' : '#999'};
  `}
`;

const LyricLine = ({
                       active,
                       content,
                   }: {
    active: boolean;
    content: string;
}) => <Style active={active}>{content}</Style>;

export default LyricLine;
