import styled, {css, keyframes} from "styled-components";

interface PageProps {
    active: boolean;
}

interface DotProps {
    active: boolean;
}

export const myScale = keyframes`
    0% {-webkit-transform: scale(1.1)}
    20% {-webkit-transform: scale(1.08)}
    40% {-webkit-transform: scale(1.06)}
    60% {-webkit-transform: scale(1.04)}
    80% {-webkit-transform: scale(1.02)}
    100% {-webkit-transform: scale(1)}
`

export const myScaleHover = keyframes`
    0% {-webkit-transform: scale(1)}
    20% {-webkit-transform: scale(1.02)}
    40% {-webkit-transform: scale(1.04)}
    60% {-webkit-transform: scale(1.06)}
    80% {-webkit-transform: scale(1.08)}
    100% {-webkit-transform: scale(1.1)}
`

export const Container = styled.div`
    position: relative;
    display: flex;
    justify-content: center;
    position: relative;
    -webkit-animation: ${myScale} .2s;
    animation-fill-mode: forwards;
    &:hover {
        -webkit-animation: ${myScaleHover} .2s;
        animation-fill-mode: forwards;
        transform-origin: center;
    }
`;

export const pageFade = keyframes`
  from {opacity: .4}
  to {opacity: 1}
`;

export const Page = styled.div<PageProps>`
  -webkit-animation-name: ${pageFade};
  -webkit-animation-duration: 1.5s;
  animation-name: ${pageFade};
  animation-duration: 1.5s;
  display: none;
  position: relative;
  overflow: hidden;
  ${(props: { active: any; }) =>
    props.active &&
    css`
      display: block;
    `}
`;

export const myWhiteTransform = keyframes`
    0% {top: -28%}
    20% {top: -42%}
    40% {top: -46%}
    60% {top: -50%}
    80% {top: -54%}
    100% {top: -58%}
`

export const myWhiteTransformHover = keyframes`
    0% {top: -58%}
    20% {top: -54%}
    40% {top: -50%}
    60% {top: -36%}
    80% {top: -32%}
    100% {top: -28%}
`

export const WhiteCover = styled.div`
    content: "";
    position: absolute;
    top: -58%;
    left: -18%;
    width: 150%;
    height: 150%;
    transform: rotate(24deg);
    transition: transform .2s ease, opacity .2s ease;
    -webkit-animation: ${myWhiteTransform} .2s;
    animation-fill-mode: forwards;
    &:hover {
        transform-origin: center;
        box-shadow: rgba(0 0 0 0.3) 0 7px 15px 4px;
        -webkit-animation: ${myWhiteTransformHover} .2s;
        animation-fill-mode: forwards;
    }
`

export const Img = styled.img`
  vertical-align: middle;
`;

export const PrevNext = styled.a`
  cursor: pointer;
  position: absolute;
  top: 50%;
  width: auto;
  padding: 8px;
  margin-top: -22px;
  color: white;
  font-weight: bold;
  font-size: 18px;
  transition: 0.6s ease;
  user-select: none;
  ${(props: { type: string; }) =>
    props.type === 'next' ?
        css`
      right: 0;
      border-radius: 0 3px 3px 0;
    ` :
        css`
      left: 0;
      border-radius: 3px 0 0 3px;
    `}
  &:hover {
    background-color: rgba(0,0,0,0.8);
  }
`;

export const Text = styled.div`
  color: #f2f2f2;
  font-size: 13px;
  width: 100%;
  height: 40px;
  margin-bottom: 5px;
  text-align: center;
  position: absolute;
  justify-content: center;
  align-items: center;
  flex: 1;
  word-break: break-all;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
`;

export const DotContainer = styled.div`
    position:absolute;
    bottom: 3px;
    text-align: center;
`;

export const Dot = styled.div<DotProps>`
  cursor: pointer;
  height: 7px;
  width: 7px;
  margin: 0 2px;
  background-color: #fff;
  border-radius: 50%;
  display: inline-block;
  transition: background-color 0.6s ease;
  ${(props: { active: any; }) =>
    props.active &&
    css`
       background-color: #FF5000;
    `}
`;
