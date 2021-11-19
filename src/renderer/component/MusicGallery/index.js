import React, {forwardRef, useCallback, useImperativeHandle, useRef, useState} from 'react';
import {HorizontalList} from "../HorizontalList";
import {Empty} from "antd";
import {PrevNext, PrevNextHidden} from "../../pages/Home/style/index";
import './index.css'

export const MusicGallery = forwardRef(({albumList, width, showAlbumInfo, playAll}, ref) => {
    // 第一行专辑列表引用
    let topRef = useRef()
    // 第二行专辑列表引用
    let bottomRef = useRef()

    // 左侧翻页按钮是否显示
    const [activeLeftButton, setActiveLeftButton] = useState(false)
    // 右侧翻页按钮是否显示
    const [activeRightButton, setActiveRightButton] = useState(true)

    useImperativeHandle(ref, () => ({
        toFirst: () => {
            topRef.current?.toFirst()
            bottomRef.current?.toFirst()
            setActiveLeftButton(false)
        },

        showRightButton: (isShow) => {
            setActiveRightButton(isShow)
        }
    }))

    /**
     * 翻页时触发的回调，用于更新状态
     * @type {(function(*): void)|*}
     */
    const onPageClick = useCallback((e) => {
        e.preventDefault();
        const {type} = e.target
        if (type === 'prev') {
            topRef.current?.prev()
            bottomRef.current?.prev()
            setActiveRightButton(true)
        } else if (type === 'next') {
            topRef.current?.next()
            bottomRef.current?.next()
            setActiveLeftButton(true)
        }
    }, []);

    // 根据状态渲染左边的箭头
    const renderLeftArrow = () => {
        if (activeLeftButton) {
            return <PrevNext type={'prev'} onClick={onPageClick}>&#10094;</PrevNext>
        } else {
            return <PrevNextHidden type={'prev'}>&#10094;</PrevNextHidden>
        }
    }

    // 根据状态渲染右边的箭头
    const renderRightArrow = (margin) => {
        if (activeRightButton) {
            return <PrevNext type={'next'} onClick={onPageClick} margin={margin}>&#10095;</PrevNext>
        } else {
            return <PrevNextHidden type={'next'}>&#10095;</PrevNextHidden>
        }
    }

    // 滚动到专辑列表首页
    const onScrollFirst = () => {
        setActiveLeftButton(false)
    }

    // 滚动到专辑列表尾页
    const onScrollLast = () => {
        setActiveRightButton(false)
    }

    // 渲染专辑列表UI
    const renderMusicGallery = () => {
        const margin = Number(width / 37.5) / 2 + "px"
        return (
            <div className={"musicGalleryContainer"}>
                <>
                    {
                        albumList.top && albumList.top.length > 0 ?
                            <>
                                {renderLeftArrow()}
                                <div className={"musicGalleryList"}>
                                    <HorizontalList
                                        ref={topRef}
                                        width={width}
                                        album={albumList.top}
                                        another={albumList.bottom}
                                        showAlbumInfo={showAlbumInfo}
                                        playAll={playAll}
                                        onScrollFirst={onScrollFirst}
                                        onScrollLast={onScrollLast}
                                    />
                                    <HorizontalList
                                        ref={bottomRef}
                                        width={width}
                                        album={albumList.bottom}
                                        another={albumList.top}
                                        showAlbumInfo={showAlbumInfo}
                                        playAll={playAll}
                                    />
                                </div>
                                {renderRightArrow(margin)}
                            </> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}/>
                    }
                </>
            </div>
        )
    }

    return renderMusicGallery()
})
