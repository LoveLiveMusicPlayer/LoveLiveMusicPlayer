import React from 'react';
import styled, {css} from 'styled-components';

const Style = styled.div<{
    active: boolean;
    position: string;
}>`
  padding: 4px 10px;

  ${({active, position}) => css`
    color: ${active ? 'lightgreen' : '#999'};
    font-size: ${active ? '20px' : '16px'};
    text-align: ${position == "center" ? 'center' : 'left'};
  `}
`;

const LyricLine = ({
                       active,
                       content,
                       position
                   }: {
    active: boolean;
    content: string;
    position: string;
}) => <Style active={active} position={position}>{content}</Style>;

export default LyricLine;
