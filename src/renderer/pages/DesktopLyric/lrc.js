import React, {useEffect, useState} from 'react';
import './index.less'
import {ipcRenderer} from 'electron'
import * as Images from '../../public/Images'

let win = require('@electron/remote').getGlobal("lyricWindow");

export default function () {

    const [currentLyric, setCurrentLyric] = useState(null)
    const [singleLine, setSingleLine] = useState(true)
    const [height, setHeight] = useState(window.innerHeight)
    const [mouseOver, setMouseOver] = useState(false)

    // 监听窗口改变大小
    const listener = function () {
        setHeight(window.innerHeight)
    }

    useEffect(() => {
        const height = singleLine ? '80px' : '180px'
        document.getElementsByTagName('body')[0].style.maxHeight = height
        document.getElementsByTagName('body')[0].style.height = height
        document.getElementsByTagName('body')[0].style.minHeight = height
    }, [singleLine])

    useEffect(() => {
        document.ondragstart = function () {
            return false;
        };

        // 添加窗口大小变化监听器
        window.addEventListener("resize", listener)

        const desktop = document.querySelector("#desktop");
        let biasX = 0;
        let biasY = 0;

        let {width, height} = win.getBounds();
        const moveEvent = (e) => {
            win.setBounds({
                x: e.screenX - biasX,
                y: e.screenY - biasY,
                width,
                height,
            });
        };

        desktop.addEventListener("mousedown", function (e) {
            width = win.getBounds().width;
            height = win.getBounds().height;
            switch (e.button) {
                case 0:
                    biasX = e.x;
                    biasY = e.y;
                    desktop.addEventListener("mousemove", moveEvent);
                    break;
                case 2:
                    break;
            }
        });

        desktop.addEventListener("mouseup", (e) => {
            biasX = 0;
            biasY = 0;
            desktop.removeEventListener("mousemove", moveEvent);
        });

        desktop.addEventListener("mouseleave", (e) => {
            setMouseOver(false)
            biasX = 0;
            biasY = 0;
            desktop.removeEventListener("mousemove", moveEvent);
        });

        desktop.addEventListener("mouseover", (e) => {
            setMouseOver(true)
        })

        // 观测DOM节点动态设置窗口大小
        const elem = document.querySelector("#lrc");
        let ob = new MutationObserver((mutationRecords) => {
            let {type} = mutationRecords[0];
            if (type === "characterData") {
                let width = elem.getBoundingClientRect().width + 20;
                ipcRenderer.send("desktop-resize", width);
            }
        });
        ob.observe(elem, {
            childList: true,
            subtree: true,
            characterDataOldValue: true,
        });
        return () => window.removeEventListener("resize", listener)
    }, [])

    return (
        <div className="desktop-lyric" id="desktop"
             style={{height: height, background: mouseOver ? '#fff' : 'transparent'}}>
            <div className="function">
                <img src={Images.ICON_SETTING} style={{width: 20, height: 20}}/>
            </div>
            <div className="playing-lyric" id="lrc">
                {currentLyric ? currentLyric : "暂无歌词"}
            </div>
        </div>
    )
}
