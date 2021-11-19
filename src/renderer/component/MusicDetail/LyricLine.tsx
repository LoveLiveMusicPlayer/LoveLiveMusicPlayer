import React from 'react';
import styled, {css} from 'styled-components';

const Style = styled.div<{
    active: boolean;
    position: string;
    lang: string;
}>`
    padding: 4px 10px;
    font-size: 16px;
    ${({active, position, lang}) => css`
        color: ${active ? 'lightgreen' : '#999'};
        text-align: ${position == "center" ? 'center' : 'left'};
        lang: ${lang};
  `}
`;

const LyricLine = ({
                       active,
                       content,
                       position,
                       lang
                   }: {
    active: boolean;
    content: string;
    position: string;
    lang: string;
}) => <Style active={active} position={position} lang={lang}>{content}</Style>;

export default LyricLine;
