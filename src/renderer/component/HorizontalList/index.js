import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import VirtualList from 'react-tiny-virtual-list';
import ImagePagination from '../Pagin'

const parseData = (album, other) => {
    let owner = album.length
    let another = other.length

    if (owner > 5 && owner % 5 > 0) {
        owner = owner + 5 - (owner % 5)
    }

    if (another > 5 && another % 5 > 0) {
        another = another + 5 - (another % 5)
    }
    for (let i = 0; i < Math.max(owner, another) - album.length; i++) {
        album.push([{
            id: "",
            src: "",
            text: ""
        }])
    }
    return album
}

export const HorizontalList = forwardRef((props, ref) => {
    const album = parseData(props?.album, props?.another)
    const clientWidth = props?.width
    const margin = Number(clientWidth / 37.5)
    const rectSize = margin * 5

    const [number, setNumber] = useState(0)
    const [scrollToIndex, setScrollToIndex] = useState(0)

    const listRef = useRef()

    useEffect(() => {
        if (album.length - number <= 5) {
            setScrollToIndex(album.length - 1)
            props?.onScrollLast && props.onScrollLast()
        } else {
            setScrollToIndex(number)
        }
    }, [number])

    useImperativeHandle(ref, () => ({
        prev: () => {
            const prevNum = number - 5
            if (prevNum >= 0) {
                setNumber(prevNum)
                if (prevNum === 0) {
                    props?.onScrollFirst && props.onScrollFirst()
                }
            } else {
                props?.onScrollFirst && props.onScrollFirst()
            }
        },
        next: () => {
            const nextNum = number + 5
            if (nextNum <= album.length) {
                setNumber(nextNum)
                if (album.length - nextNum <= 5) {
                    props?.onScrollLast && props.onScrollLast()
                }
            } else {
                props?.onScrollFirst && props.onScrollFirst()
            }
        },
        toFirst: () => {
            setNumber(0)
        }
    }))

    const renderItem = ({index, style}) => {
        if (album[index][0].text !== "") {
            return (
                <div key={index} style={style}>
                    <div style={{
                        width: rectSize * 1.1,
                        height: rectSize * 1.1,
                        marginTop: rectSize * 0.1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: margin / 2
                    }}>
                        <ImagePagination key={album[index][0].text} pages={album[index]} onItemClick={props?.chooseItem}
                                         imgSide={rectSize}/>
                    </div>
                </div>
            )
        } else return (
            <div key={index} style={style}>
                <div style={{
                    width: rectSize * 1.1,
                    height: rectSize * 1.1,
                    marginLeft: margin / 2
                }}/>
            </div>
        )
    }

    return (
        <div>
            {
                album.length > 0 ?
                    <VirtualList
                        ref={node => listRef.current = node}
                        width={clientWidth * 0.8}
                        height={rectSize * 1.6}
                        style={{overflow: 'hidden'}}
                        overscanCount={5}
                        itemCount={album.length}
                        scrollDirection={"horizontal"}
                        itemSize={margin + rectSize}
                        scrollToIndex={scrollToIndex}
                        renderItem={renderItem}
                    /> : null
            }
        </div>
    )
})
