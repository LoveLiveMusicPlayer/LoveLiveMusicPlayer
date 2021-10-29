// @ts-ignore
import React, {useCallback, useEffect, useState} from 'react';
import {Container, Dot, DotContainer, Img, Page, PrevNext, Text, WhiteCover} from './styled-components'

interface ImagePaginationProps {
    pages: {
        id: string,
        src: string,
        text: string,
    }[],
    dotDisplay: boolean,
    onItemClick: any,
    imgSide: any
}

const Index = (
    {pages, dotDisplay = true, imgSide, onItemClick}: ImagePaginationProps,
) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeButton, setActiveButton] = useState(false);

    const onClick = useCallback((e: React.MouseEvent<any>) => {
        e.preventDefault();
        // @ts-ignore
        const {type} = e.target as HTMLAnchorElement;
        if (type === 'prev') {
            if (activeIndex == 0) {
                setActiveIndex(pages.length - 1);
            } else {
                setActiveIndex((activeIndex: number) => activeIndex - 1);
            }
        } else if (type === 'next') {
            if (activeIndex === pages.length - 1) {
                setActiveIndex(0);
            } else {
                setActiveIndex((activeIndex: number) => activeIndex + 1);
            }
        }
    }, [pages, activeIndex, setActiveIndex]);
    const onMouseEnter = useCallback((e: React.MouseEvent<any>) => {
        e.preventDefault();
        setActiveButton(true);
    }, [activeButton, setActiveButton]);
    const onMouseLeave = useCallback((e: React.MouseEvent<any>) => {
        e.preventDefault();
        setActiveButton(false);
    }, [activeButton, setActiveButton]);


    useEffect(() => {
        let intervalId: NodeJS.Timeout
        if (pages.length > 1) {
            intervalId = setInterval(() => {
                if (activeIndex === (pages.length - 1)) {
                    setActiveIndex(0);
                } else {
                    setActiveIndex((activeIndex: number) => activeIndex + 1);
                }
            }, 5000);
        }
        return () => {
            clearInterval(intervalId)
        }
    }, [activeIndex])

    const text = pages && pages[activeIndex]?.text
    return (
        <>
            <Container
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <div>
                    {
                        pages && pages.map((img, idx) => (
                            <Page
                                key={`${img.src}_${idx}`}
                                active={activeIndex === idx}
                                onClick={(event: any) => event && onItemClick(img.id)}
                            >
                                <WhiteCover/>
                                <Img src={decodeURI(img.src)} style={{width: imgSide, height: imgSide}}/>
                            </Page>
                        ))
                    }

                    {text && <Text>{text}</Text>}
                </div>
                {
                    activeButton && pages && pages.length > 1 && <>
                        <PrevNext type={'prev'} onClick={onClick}>&#10094;</PrevNext>
                        <PrevNext type={'next'} onClick={onClick}>&#10095;</PrevNext>
                    </>
                }
                {
                    dotDisplay && pages && pages.length > 1 && <DotContainer>
                        {pages.map((img, idx) => (
                            <Dot key={`${img.src}_${idx}`} active={activeIndex === idx}
                                 onClick={(event: any) => event && setActiveIndex(idx)}/>
                        ))}
                    </DotContainer>
                }
            </Container>
        </>
    );
};

export default Index;
