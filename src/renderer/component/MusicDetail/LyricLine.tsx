// @ts-nocheck
import React from 'react';
import styled, {css} from 'styled-components';

const Single = styled.div<{
    active: boolean;
    position: string;
    lang: string;
    scale: number;
}>`
    padding: 4px 10px;
    ${({active, position, lang, scale}) => css`
        color: ${active ? 'lightgreen' : '#999'};
        text-align: ${position == "center" ? 'center' : 'left'};
        lang: ${lang};
        font-size: ${scale}px;
    `}
`;

const Double = styled.div<{
    active: boolean;
    position: string;
    lang: string;
    scale: number;
}>`
    ${({active, position, lang, scale}) => css`
        color: ${active ? 'lightgreen' : '#999'};
        text-align: ${position == "center" ? 'center' : 'left'};
        lang: ${lang};
        font-size: ${scale}px;
    `}
`;

export const LyricLine = ({
                              active,
                              content,
                              position,
                              lang,
                              scale
                          }: {
    active: boolean;
    content: string;
    position: string;
    lang: string;
    scale: number;
}) => <Single active={active} position={position} lang={lang} scale={scale}>{content}</Single>;

export const LyricDoubleLine = ({
                                    active,
                                    headContent,
                                    footContent,
                                    position,
                                    scale
                                }: {
    active: boolean;
    headContent: string;
    footContent: string;
    position: string;
    scale: number;
}) => (
    <div style={{marginTop: 12, marginBottom: 12}}>
        <Double active={active} position={position} lang={'jp'} scale={scale}>{headContent}</Double>
        <Double active={active} position={position} lang={'zh'} scale={scale}>{footContent}</Double>
    </div>
)
