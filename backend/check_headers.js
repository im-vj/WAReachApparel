import xlsx from 'xlsx';

const filePath = '../Apparel Business Zone 🌹.xlsx';
const workbook = xlsx.readFile(filePath);

const sheetName = workbook.SheetNames.includes('WA-Download Group Phone Numbers') 
    ? 'WA-Download Group Phone Numbers' 
    : workbook.SheetNames[0];

const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Headers:', data[0]);
