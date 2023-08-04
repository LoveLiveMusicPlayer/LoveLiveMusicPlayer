import React, { useEffect, useRef } from 'react';
import './index.less'
import {ipcRenderer} from 'electron'
import { Loading } from '../../component/Loading';
import Logger from '../../utils/Logger';

export default function () {
    let loadingRef = useRef()

    const startListener = () => {
      Logger(`start download...`)
      loadingRef.current?.show()
      loadingRef.current?.setTitle("下载中...")
      loadingRef.current?.setProgress(0)
    }

    const progressListener = (progress) => {
      Logger(`download progress: ${progress}`)
      loadingRef.current?.setProgress(progress)
    }

    const endListener = () => {
      Logger(`end download...`)
      loadingRef.current?.setProgress(0)
      loadingRef.current?.hide()
    }

    useEffect(() => {
      ipcRenderer.on('update_start', startListener)
      ipcRenderer.on('update_progress', progressListener)
      ipcRenderer.on('update_end', endListener)

      return () => {
        ipcRenderer.removeListener("update_start", startListener)
        ipcRenderer.removeListener("update_progress", progressListener)
        ipcRenderer.removeListener("update_end", endListener)
      }
    }, [])

    return (
      <Loading ref={loadingRef}/>
    )
}
