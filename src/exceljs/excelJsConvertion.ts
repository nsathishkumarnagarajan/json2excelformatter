import exceljs from 'exceljs';
import fs from 'fs';
import { config } from "../DTO/config";

import { treeFormat } from '../formatter/tree';
import { customFormat } from '../formatter/custom';
import { defaultFormat } from '../formatter/default';

class ExceljsConvertion {
    constructor() {}

    /**
     * This method help to find the data format and calls respective method, then return formatted data
     * @param {*} dataFormat 
     * @param {*} data 
     * @returns {*} 
     */
    async formattingData(dataFormat: string, data: any, headerName?: string) {
        switch(dataFormat) {
            case 'default':
                return defaultFormat.startFormat(data);
            case 'custom':
                return customFormat.startFormat(data);
            case 'tree':
                await treeFormat.startFormat(data, headerName);
                return await treeFormat.getFormat();
                // return treeFormat.formatTree(data, headerName);
            default:
                throw new Error('dataFormat must mention in config');
        }
    }

    async initProcess(config: config, data: any) {
        let { sheetName, headerName, headerStyle, dataFormat } = config;
        let workbook = new exceljs.Workbook();
        let sheet = workbook.addWorksheet(sheetName);
    
        // let { header, cellData } = treeFormatter.formatTree(data);
        let { header, cellData } = await this.formattingData(dataFormat, data, headerName);
    
        // Remove Duplicate from header, key should be unique
        let jsonObj = header.map(JSON.stringify);
        let uniqSet = new Set(jsonObj);
        let rmDupl = Array.from(uniqSet).map((elem: any) => JSON.parse(elem));
        sheet.columns = rmDupl;
        cellData.map((rowData: any) => sheet.addRow(rowData));
        // console.log(header);
        // console.log(cellData);
    
        sheet.eachRow((row: any, rowNum: any) => {
            row.eachCell((cell: any, colNum: any) => {
                cell.alignment = { wrapText: true }
                if(rowNum > 1) {
                    if(cell.value.data.style) {
                        cell.font = cell.value.data.style.font;
                        cell.fill = cell.value.data.style.fill;
                    }
                    if(cell.value.type == 'link') {
                        cell.value = {
                            text: cell.value.data.text,
                            hyperlink: cell.value.data.hyperLink,
                            tooltip: cell.value.data.toolTip
                        }
                    } else {
                        cell.value = cell.value.data.text;
                    }
                }
            });
        });
    
        sheet.getRow(1).fill = headerStyle.fill;
        sheet.getRow(1).font = headerStyle.font;

        if (!fs.existsSync('output')){
            fs.mkdirSync('output');
        }
    
        workbook.creator = 'sathishkumarnagarajan@hotmail.com';
        workbook.lastModifiedBy = 'sathishkumarnagarajan@hotmail.com';
        workbook.created = new Date();
        workbook.xlsx.writeFile('output/test.xlsx');
    }
}

export const excelJsConvertion = new ExceljsConvertion();