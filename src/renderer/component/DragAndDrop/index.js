import React, {useEffect, useRef, useState} from "react";
import PropTypes from 'prop-types';
import classList from './index.scss';

const FilesDragAndDrop = (props) => {
    const [dragging, setDragging] = useState(false);
    const [message, setMessage] = useState({show: false, text: null, type: null});
    const drop = useRef();
    const drag = useRef();
    useEffect(() => {
        // useRef 的 drop.current 取代了 ref 的 this.drop
        drop.current?.addEventListener('dragover', handleDragOver);
        drop.current?.addEventListener('drop', handleDrop);
        drop.current?.addEventListener('dragenter', handleDragEnter);
        drop.current?.addEventListener('dragleave', handleDragLeave);
        return () => {
            drop.current?.removeEventListener('dragover', handleDragOver);
            drop.current?.removeEventListener('drop', handleDrop);
            drop.current?.removeEventListener('dragenter', handleDragEnter);
            drop.current?.removeEventListener('dragleave', handleDragLeave);
        }
    })
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false)
        const {count, formats} = props;
        const files = [...e.dataTransfer.files];

        if (count && count < files.length) {
            // showMessage(`抱歉，每次最多只能上传${count} 文件。`, 'error', 2000);
            return;
        }

        if (formats && files.some((file) => !formats.some((format) => file.name.toLowerCase().endsWith(format.toLowerCase())))) {
            // showMessage(`只允许上传 ${formats.join(', ')}格式的文件`, 'error', 2000);
            return;
        }

        if (files && files.length) {
            // showMessage('成功上传！', 'success', 1000);
            props.onUpload(files);
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.target !== drag.current && setDragging(true)
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.target === drag.current && setDragging(false)
    };

    const showMessage = (text, type, timeout) => {
        setMessage({show: true, text, type,})
        setTimeout(() =>
            setMessage({show: false, text: null, type: null,},), timeout);
    };

    return (
        <div
            ref={drop}
            style={{width: "100%", height: "100%"}}
            className={'FilesDragAndDrop'}
        >
            {/*{message.show && (*/}
            {/*    <div*/}
            {/*        className={classNames(*/}
            {/*            classList['FilesDragAndDrop__placeholder'],*/}
            {/*            classList[`FilesDragAndDrop__placeholder--${message.type}`],*/}
            {/*        )}*/}
            {/*    >*/}
            {/*        {message.text}*/}
            {/*        <span*/}
            {/*            role='img'*/}
            {/*            aria-label='emoji'*/}
            {/*            className={classList['area__icon']}*/}
            {/*        >*/}
            {/*            {message.type === 'error' ? <>&#128546;</> : <>&#128536;</>}*/}
            {/*        </span>*/}
            {/*    </div>*/}
            {/*)}*/}
            {/*{dragging && (*/}
            {/*    <div*/}
            {/*        ref={drag}*/}
            {/*        className={classList['FilesDragAndDrop__placeholder']}*/}
            {/*    >*/}
            {/*        请放手*/}
            {/*        <span*/}
            {/*            role='img'*/}
            {/*            aria-label='emoji'*/}
            {/*            className={classList['area__icon']}*/}
            {/*        >*/}
            {/*            &#128541;*/}
            {/*        </span>*/}
            {/*    </div>*/}
            {/*)}*/}
            {props.children}
        </div>
    );
}

FilesDragAndDrop.propTypes = {
    onUpload: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    count: PropTypes.number,
    formats: PropTypes.arrayOf(PropTypes.string)
}

export default FilesDragAndDrop;
