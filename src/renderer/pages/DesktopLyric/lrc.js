import React, {useEffect, useState} from 'react';
import './index.less'
import {ipcRenderer} from 'electron'

let win = require('@electron/remote').getGlobal("lyricWindow");

export default function () {

    const [currentLyric, setCurrentLyric] = useState(null)
    const [singleLine, setSingleLine] = useState(true)

    useEffect(() => {
        console.log(document.getElementsByTagName('body')[0])
        document.getElementsByTagName('body')[0].style.maxHeight = '180px'
        document.getElementsByTagName('body')[0].style.height = '180px'
        document.getElementsByTagName('body')[0].style.minHeight = '180px'
    }, [singleLine])

    useEffect(() => {
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
            biasX = 0;
            biasY = 0;
            desktop.removeEventListener("mousemove", moveEvent);
        });

        // 观测DOM节点动态设置窗口大小
        const elem = document.querySelector("#lrc");
        let ob = new MutationObserver((mutationRecords) => {
            let {type} = mutationRecords[0];
            if (type === "characterData") {
                console.log(elem.getBoundingClientRect().height)
                let width = elem.getBoundingClientRect().width + 20;
                ipcRenderer.send("desktop-resize", width);
            }
        });
        ob.observe(elem, {
            childList: true,
            subtree: true,
            characterDataOldValue: true,
        });
    }, [])

    return (
        <div className="desktop-lyric" id="desktop" style={{
            height: singleLine ? 80 : 185,
            maxHeight: singleLine ? 80 : 185,
            minHeight: singleLine ? 80 : 185
        }}>
            <div className="playing-lyric" id="lrc">
                {currentLyric ? currentLyric : "暂无歌词"}
            </div>
            {/*<div className="playing-lyric" id="lrc2">*/}
            {/*    {currentLyric ? currentLyric : "暂无歌词"}*/}
            {/*</div>*/}
        </div>
    )
}
