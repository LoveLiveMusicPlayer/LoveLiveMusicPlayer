import React from 'react';
import {Dropdown, Menu} from "antd";
import * as Images from "../../public/Images";
import './index.css'
import {VersionUtils} from "../../utils/VersionUtils";

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

    const renderDevPortMenu = () => {
        if (VersionUtils.getIsPreEnv()) {
            return (
                <>
                    <Menu.Item key={"httpUrl"}>
                        <a onClick={onSetHttpUrl}>设置网络地址</a>
                    </Menu.Item>
                    <Menu.Divider/>
                </>
            )
        }
        return null
    }

    const menu = (
        <Menu>
            <Menu.Item key={"directory"}>
                <a onClick={selectDirectory}>选择曲库</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"port"}>
                <a onClick={onSetPort}>设置端口</a>
            </Menu.Item>
            <Menu.Divider/>
            {renderDevPortMenu()}
            <Menu.Item key={"theme"}>
                <a onClick={changeColor}>设置主题</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"playAll"}>
                <a onClick={playAll}>全部播放</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"deleteData"}>
                <a onClick={deleteData}>清理数据</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"refreshData"}>
                <a onClick={refreshData}>更新数据</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"checkUpdate"}>
                <a onClick={checkUpdate}>检查更新</a>
            </Menu.Item>
        </Menu>
    )

    return (
        <>
            <div className={"star_container"}>
                <div className={"shooting_star"}/>
            </div>

            <div className={"star_container"}>
                <Dropdown overlay={menu} placement="bottomCenter">
                    <img
                        className={"tiny_star"}
                        src={Images.ICON_SETTING}
                        width={"30rem"}
                        height={"30rem"}
                    />
                </Dropdown>
            </div>
        </>
    )
}
