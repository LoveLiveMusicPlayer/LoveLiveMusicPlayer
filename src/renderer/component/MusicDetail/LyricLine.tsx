// @ts-nocheck
import React from 'react';
import styled, {css} from 'styled-components';

const Single = styled.div<{
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

const Double = styled.div<{
    active: boolean;
    position: string;
    lang: string;
}>`
    font-size: 16px;
    ${({active, position, lang}) => css`
        color: ${active ? 'lightgreen' : '#999'};
        text-align: ${position == "center" ? 'center' : 'left'};
        lang: ${lang};
  `}
`;

export const LyricLine = ({
                              active,
                              content,
                              position,
                              lang
                          }: {
    active: boolean;
    content: string;
    position: string;
    lang: string;
}) => <Single active={active} position={position} lang={lang}>{content}</Single>;

export const LyricDoubleLine = ({
                                    active,
                                    headContent,
                                    footContent,
                                    position
                                }: {
    active: boolean;
    headContent: string;
    footContent: string;
    position: string;
}) => (
    <div style={{marginTop: 10, marginBottom: 10}}>
        <Double active={active} position={position} lang={'jp'}>{headContent}</Double>
        <Double active={active} position={position} lang={'zh'}>{footContent}</Double>
    </div>
)
