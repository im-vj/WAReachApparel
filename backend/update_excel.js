import xlsx from 'xlsx';

try {
  const filePath = '../Apparel Business Zone 🌹.xlsx';
  const workbook = xlsx.readFile(filePath);

  const sheetName = workbook.SheetNames.includes('WA-Download Group Phone Numbers') 
      ? 'WA-Download Group Phone Numbers' 
      : workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  let updated = 0;
  // Start from row 1 (skipping header)
  for (let i = 1; i < data.length; i++) {
    if (data[i]) {
      data[i][1] = '918310438481';
      updated++;
    }
  }

  const newSheet = xlsx.utils.aoa_to_sheet(data);
  workbook.Sheets[sheetName] = newSheet;

  const newFilePath = '../Test_Apparel_Business_Zone.xlsx';
  xlsx.writeFile(workbook, newFilePath);
  console.log(`Successfully created Test_Apparel_Business_Zone.xlsx with ${updated} rows updated to the test number.`);
} catch (e) {
  console.error("Error updating excel:", e);
}
