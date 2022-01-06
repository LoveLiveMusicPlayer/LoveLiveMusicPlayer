const electron = require('electron')
const {BrowserWindow, app} = electron

function checkProcessType() {
    if (!BrowserWindow) {
        throw Error('[electron-frameless-window-plugin]This plugin should be run in main process.')
    }
}

function rewriteTransparentWindowMethods(win) {
    checkProcessType()
    // rewrite getNormalBounds, maximize, unmaximize and isMaximized API for the transparent window
    let resizable = win.isResizable()
    let normalBounds = win.getNormalBounds ? win.getNormalBounds() : win.getBounds()

    win.getNormalBounds = function () {
        if (!this.isMaximized()) {
            if (BrowserWindow.prototype.getNormalBounds) {
                normalBounds = BrowserWindow.prototype.getNormalBounds.call(this)
            } else {
                normalBounds = BrowserWindow.prototype.getBounds.call(this)
            }
        }
        return normalBounds
    }.bind(win)

    win.maximize = function () {
        normalBounds = this.getNormalBounds() // store the bounds of normal window
        resizable = this.isResizable() // store resizable value
        BrowserWindow.prototype.maximize.call(this)
        if (!BrowserWindow.prototype.isMaximized.call(this)) {
            // while isMaximized() was returning false, it will not emit 'maximize' event
            this.emit('maximize', {
                sender: this, preventDefault: () => {
                }
            })
        }
        this.setResizable(false) // disable resize when the window is maximized
    }.bind(win)

    win.unmaximize = function () {
        const fromMaximized = BrowserWindow.prototype.isMaximized.call(this)
        BrowserWindow.prototype.unmaximize.call(this)
        if (!fromMaximized) {
            // isMaximized() returned false before unmaximize was called, it will not emit 'unmaximize' event
            this.emit('unmaximize', {
                sender: this, preventDefault: () => {
                }
            })
        }
        this.setResizable(resizable) // restore resizable
    }.bind(win)

    win.isMaximized = function () {
        const nativeIsMaximized = BrowserWindow.prototype.isMaximized.call(this)
        if (!nativeIsMaximized) {
            // determine whether the window is full of the screen work area
            const bounds = this.getBounds()
            const workArea = electron.screen.getDisplayMatching(bounds).workArea
            if (bounds.x <= workArea.x && bounds.y <= workArea.y && bounds.width >= workArea.width && bounds.height >= workArea.height) {
                return true
            }
        }
        return nativeIsMaximized
    }.bind(win)
}

function resetTransparentWindowMethods(win) {
    checkProcessType()
    if (BrowserWindow.prototype.getNormalBounds) {
        win.getNormalBounds = BrowserWindow.prototype.getNormalBounds.bind(win)
    } else {
        delete win.getNormalBounds
    }
    win.maximize = BrowserWindow.prototype.maximize.bind(win)
    win.unmaximize = BrowserWindow.prototype.unmaximize.bind(win)
    win.isMaximized = BrowserWindow.prototype.isMaximized.bind(win)
}

function fixDragRegionActions(win) {
    checkProcessType()
    if (process.platform !== 'win32') return

    const WM_SYSCOMMAND = 0x0112 // WM_SYSCOMMAND
    if (!win.isWindowMessageHooked(WM_SYSCOMMAND)) {
        win.hookWindowMessage(WM_SYSCOMMAND, (wParam, lParam) => {
            const wpValue = wParam.readInt32LE()
            if (wpValue === 61490 || wpValue === 61730) {
                // 61490: double click the title bar when unmaximized
                // 61730: double click the title bar when maximized
                win.setEnabled(false)
                if (win.isMaximizable()) {
                    if (win.isMaximized()) {
                        win.unmaximize()
                    } else {
                        win.maximize()
                    }
                }
                setTimeout(() => {
                    win.setEnabled(true)
                }, 50)
            } else if (wpValue === 61458) {
                // 61458: drag the title bar
                // if you drag from the maximized state, you need to restore the window size
                // and set the window position under the cursor
                if (win.isMaximizable() && win.isMaximized()) {
                    const pointer = electron.screen.getCursorScreenPoint()
                    const workArea = electron.screen.getPrimaryDisplay().workArea
                    const bounds = win.getNormalBounds ? win.getNormalBounds() : win.getBounds()
                    let clientX
                    if (pointer.x - workArea.x < bounds.width * 0.8) {
                        // the distance between the cursor and the left side of the work area is less than 4/5 window width
                        // after the window is restored, it moves to the left side of the work area
                        clientX = pointer.x - workArea.x
                    } else if (workArea.width + workArea.x - pointer.x < bounds.width * 0.8) {
                        // the distance between the cursor and the right side of the work area is less than 4/5 window width
                        // after the window is restored, it moves to the right side of the work area
                        clientX = bounds.width - (workArea.width + workArea.x - pointer.x)
                    } else {
                        // convert the position that the cursor should be in the window in the horizontal direction
                        clientX = parseInt((pointer.x - workArea.x) * bounds.width / workArea.width)
                    }
                    const winLeft = pointer.x - clientX // window left side position
                    win.unmaximize()
                    win.setBounds({
                        x: winLeft,
                        y: workArea.y,
                        width: bounds.width,
                        height: bounds.height
                    })
                }
            }
        })
    }
}

function resetDragRegionActions(win) {
    checkProcessType()
    if (process.platform !== 'win32') return

    const WM_SYSCOMMAND = 0x0112 // WM_SYSCOMMAND
    if (win.isWindowMessageHooked(WM_SYSCOMMAND)) {
        win.unhookWindowMessage(WM_SYSCOMMAND)
    }
}

function addHideFromFullScreenMethod(win) {
    // sometimes on macOS we click the close button and want the window to be hidden instead of closed
    win.hideFromFullScreen = function () {
        const opacity = this.getOpacity()
        this.once('leave-full-screen', () => {
            this.hide()
            this.setOpacity(opacity)
        })
        this.setFullScreen(false)
        this.setOpacity(0)
    }.bind(win)
}

function removeHideFromFullScreenMethod(win) {
    delete win.hideFromFullScreen
}

function disableDragRegionRightMenu(win) {
    if (process.platform !== 'win32') return

    const WM_INITMENU = 0x0116 // WM_INITMENU
    if (!win.isWindowMessageHooked(WM_INITMENU)) {
        win.hookWindowMessage(WM_INITMENU, (wParam, lParam) => {
            // disable the window menu when right click on the title bar
            win.setEnabled(false)
            setTimeout(() => {
                win.setEnabled(true)
            }, 50)
        })
    }
}

function resetDragRegionRightMenu(win) {
    checkProcessType()
    if (process.platform !== 'win32') return

    const WM_INITMENU = 0x0116 // WM_INITMENU
    if (win.isWindowMessageHooked(WM_INITMENU)) {
        win.unhookWindowMessage(WM_INITMENU)
    }
}

function plugin({
                    setGlobal = false,
                    fixTransparent = true,
                    fixDragRegion = true,
                    noDragRegionMenu = true,
                    easyHideFromFullScreen = true,
                    browserWindow
                }) {
    checkProcessType()

    if (setGlobal) {
        app.on('browser-window-created', (e, win) => {
            if (fixTransparent) {
                rewriteTransparentWindowMethods(win)
            } else {
                if (process.platform === 'win32') {
                    // hook掉标题栏右键菜单
                    win.hookWindowMessage(278, () => {
                        win?.setEnabled(false)
                        setTimeout(() => {
                            win?.setEnabled(true)
                        }, 100)
                        return true
                    })
                }
            }
            if (fixDragRegion) {
                fixDragRegionActions(win)
            }
            if (noDragRegionMenu) {
                disableDragRegionRightMenu(win)
            }
            if (easyHideFromFullScreen) {
                addHideFromFullScreenMethod(win)
            }
        })
    } else if (browserWindow instanceof BrowserWindow) {
        if (fixTransparent) {
            rewriteTransparentWindowMethods(browserWindow)
        }
        if (fixDragRegion) {
            fixDragRegionActions(browserWindow)
        }
        if (noDragRegionMenu) {
            disableDragRegionRightMenu(browserWindow)
        }
        if (easyHideFromFullScreen) {
            addHideFromFullScreenMethod(browserWindow)
        }
    } else {
        throw Error('BrowserWindow instance is required as "browserWindow" option.')
    }
}

module.exports.rewriteTransparentWindowMethods = rewriteTransparentWindowMethods
module.exports.resetTransparentWindowMethods = resetTransparentWindowMethods
module.exports.fixDragRegionActions = fixDragRegionActions
module.exports.resetDragRegionActions = resetDragRegionActions
module.exports.disableDragRegionRightMenu = disableDragRegionRightMenu
module.exports.resetDragRegionRightMenu = resetDragRegionRightMenu
module.exports.addHideFromFullScreenMethod = addHideFromFullScreenMethod
module.exports.removeHideFromFullScreenMethod = removeHideFromFullScreenMethod
module.exports.plugin = plugin
