import React from 'react';
import {Dropdown, Menu} from "antd";
import * as Images from "../../public/Images";
import './index.css'

export const TinyStar = ({
                             selectDirectory,
                             onSetPort,
                             onSetHttpUrl,
                             playAll,
                             refreshData,
                             deleteData,
                             changeColor,
                             checkUpdate
                         }) => {

    const menu = (
        <Menu>
            <Menu.Item key={"httpUrl"}>
                <a onClick={onSetHttpUrl}>使用HTTP曲库</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"directory"}>
                <a onClick={selectDirectory}>使用本地曲库</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"port"}>
                <a onClick={onSetPort}>设置本地端口</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"theme"}>
                <a onClick={changeColor}>设置颜色主题</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"playAll"}>
                <a onClick={playAll}>播放全部歌曲</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"deleteData"}>
                <a onClick={deleteData}>清理缓存数据</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"refreshData"}>
                <a onClick={refreshData}>更新歌曲数据</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"checkUpdate"}>
                <a onClick={checkUpdate}>检查软件更新</a>
            </Menu.Item>
        </Menu>
    )

    return (
        <>
            <div className={"star_container"}>
                <div className={"shooting_star"}/>
            </div>

            <div className={"star_container"}>
                <Dropdown overlay={menu} placement="bottom">
                    <img
                        className={"tiny_star"}
                        src={Images.ICON_SETTING}
                        width={"30rem"}
                        height={"30rem"}
                        alt={''}/>
                </Dropdown>
            </div>
        </>
    )
}
