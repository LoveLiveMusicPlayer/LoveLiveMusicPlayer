import * as XLSX from 'xlsx';

function ExcelOutputMan() {

}

ExcelOutputMan.prototype = {
    constructor: ExcelOutputMan,
    sheet2blob: function(sheet1, sheet2) {
        const workbook = {
            SheetNames: ['sheet1', 'sheet2'],
            Sheets: {}
        };
        workbook.Sheets['sheet1'] = sheet1;
        workbook.Sheets['sheet2'] = sheet2;

        // 生成excel的配置项
        const wopts = {
            bookType: 'xlsx', // 要生成的文件类型
            bookSST: false, // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
            type: 'binary'
        };

        const wbout = XLSX.write(workbook, wopts);
        // 字符串转ArrayBuffer
        function s2ab(s) {
            const buf = new ArrayBuffer(s.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }
        return new Blob([s2ab(wbout)], {
            type: 'application/octet-stream'
        });
    },

    openDownloadDialog: function(url, saveName) {
        if (typeof url == 'object' && url instanceof Blob) {
            url = URL.createObjectURL(url); // 创建blob地址
        }
        const aLink = document.createElement('a');
        aLink.href = url;
        aLink.download = saveName || ''; // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效
        let event;
        if (window.MouseEvent) event = new MouseEvent('click');
        else {
            event = document.createEvent('MouseEvents');
            event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        }
        aLink.dispatchEvent(event);
    },

    outPut: function({ header1 = [], data1 = [], header2 = [], data2 = [], excelName = '' }) {
        const _data1 = [
            header1,
            ...data1
        ];
        const _data2 = [
            header2,
            ...data2
        ];
        const sheet1 = XLSX.utils.aoa_to_sheet(_data1);
        const sheet2 = XLSX.utils.aoa_to_sheet(_data2);
        this.openDownloadDialog(this.sheet2blob(sheet1, sheet2), `${excelName}.xlsx`);
    }
}

const EXCEL = new ExcelOutputMan();
export default EXCEL;
