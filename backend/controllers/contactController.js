import prisma from '../prismaClient.js';
import xlsx from 'xlsx';

export const getAllContacts = async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const importContacts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    let sheetName = 'WA-Download Group Phone Numbers';
    let sheet = workbook.Sheets[sheetName];
    
    if (!sheet) {
      sheetName = workbook.SheetNames[0];
      sheet = workbook.Sheets[sheetName];
    }

    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    let imported = 0;

    const operations = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const phoneCell = row[1];
      const savedName = row[2] ? String(row[2]).trim() : '';
      const displayName = row[3] ? String(row[3]).trim() : '';
      const isAdmin = String(row[4]).toLowerCase() === 'yes';

      if (!phoneCell) continue;
      let phoneNumber = String(phoneCell).replace(/[^0-9]/g, '');

      if (!phoneNumber || phoneNumber.includes('NaN') || String(phoneCell).toLowerCase().includes('free version')) {
        continue;
      }

      if (phoneNumber.length < 10) continue;

      let name = displayName || savedName || 'User';

      operations.push(
        prisma.contact.upsert({
          where: { phoneNumber },
          update: {
            displayName: name,
            savedName,
            isAdmin
          },
          create: {
            phoneNumber,
            displayName: name,
            savedName,
            isAdmin,
            status: 'PENDING'
          }
        })
      );
    }

    // Execute all upserts in a single transaction for massive performance boost
    await prisma.$transaction(operations);
    const imported = operations.length;

    res.json({ message: `${imported} contacts imported successfully`, imported });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteContact = async (req, res) => {
  try {
    await prisma.sendLog.deleteMany({ where: { contactId: Number(req.params.id) } });
    await prisma.contact.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetContacts = async (req, res) => {
  try {
    await prisma.contact.updateMany({
      data: {
        status: 'PENDING',
        errorMessage: null,
        waMessageId: null
      }
    });
    res.json({ message: 'All contacts reset to PENDING' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
