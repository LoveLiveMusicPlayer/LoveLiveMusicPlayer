// @ts-ignore
import styled, {css} from "styled-components";

export const PrevNext = styled.a`
  cursor: pointer;
  width: auto;
  padding: 8px;
  color: white;
  font-weight: bold;
  font-size: 18px;
  transition: 0.6s ease;
  user-select: none;
  background-color: 'white';

  ${(props: { type: string; margin: string }) =>
    props.type === 'next' ?
        css`
      right: -${props.margin};
      border-radius: 0 3px 3px 0;
    ` :
        css`
      left: 0;
      border-radius: 3px 0 0 3px;
    `
}
  &:hover {
    background-color: rgba(0,0,0,0.8);
  }
`;

export const PrevNextHidden = styled.a`
  cursor: pointer;
  width: auto;
  padding: 8px;
  color: white;
  font-weight: bold;
  font-size: 18px;
  transition: 0.6s ease;
  user-select: none;
  background-color: 'white';
  visibility: hidden;

  ${(props: { type: string; margin: string }) =>
    props.type === 'next' ?
        css`
      right: -${props.margin};
      border-radius: 0 3px 3px 0;
    ` :
        css`
      left: 0;
      border-radius: 3px 0 0 3px;
    `
}
`;
