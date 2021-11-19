// @ts-ignore
import React, {useEffect, useState} from 'react';
import {Container, Dot, DotContainer, Img, Page, Play, PrevNext, Text, WhiteCover} from './styled-components'
import * as Images from '../../public/Images'

interface ImagePaginationProps {
    pages: {
        id: string,
        src: string,
        text: string,
    }[],
    dotDisplay: boolean,
    imgSide: any,
    whiteCover: boolean,
    effect: boolean,
    playButton: boolean,
    showAlbumInfo: any,
    playAll: any,
}

const Index = (
    {
        pages,
        dotDisplay = true,
        imgSide,
        whiteCover = true,
        effect = true,
        playButton = true,
        showAlbumInfo,
        playAll
    }: ImagePaginationProps,
) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeButton, setActiveButton] = useState(false);
    const [activePlayButton, setActivePlayButton] = useState(false);
    const [playButtonPic, setPlayButtonPic] = useState(Images.ICON_PLAY_UNSELECT)

    const onClick = (e: React.MouseEvent<any>) => {
        e.preventDefault();
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
    };

    const onMouseEnter = (e: React.MouseEvent<any>) => {
        e.preventDefault();
        setActiveButton(true);
        setActivePlayButton(true);
    };
    const onMouseLeave = (e: React.MouseEvent<any>) => {
        e.preventDefault();
        setActiveButton(false);
        setActivePlayButton(false);
    };


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
                effect={effect}
            >
                <div>
                    {
                        pages && pages.map((img, idx) => (
                            <Page
                                key={`${img.src}_${idx}`}
                                active={activeIndex === idx}
                                onClick={(event: any) => event && showAlbumInfo(img.id)}
                            >
                                {whiteCover ? <WhiteCover/> : null}
                                <Img
                                    src={decodeURI(img.src)}
                                    style={{
                                        width: imgSide,
                                        height: imgSide,
                                        borderRadius: 5,
                                        borderWidth: 10
                                    }}
                                    onError={(e: { target: { onerror: null; src: string; }; }) => {
                                        e.target.onerror = null
                                        e.target.src = Images.ICON_EMPTY
                                    }}
                                />
                            </Page>
                        ))
                    }

                    {text && <Text>{text}</Text>}
                </div>
                {
                    playButton && activePlayButton && pages &&
                    <Play
                        src={playButtonPic}
                        onMouseOver={() => setPlayButtonPic(Images.ICON_PLAY_SELECT)}
                        onMouseOut={() => setPlayButtonPic(Images.ICON_PLAY_UNSELECT)}
                        onClick={() => playAll(pages[0])}
                    />
                }
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
