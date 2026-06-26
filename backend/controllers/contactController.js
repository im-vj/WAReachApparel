import prisma from '../prismaClient.js';
import ExcelJS from 'exceljs';
import { logger } from '../utils/logger.js';

export const getAllContacts = async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany();
    res.json(contacts);
  } catch (error) {
    logger.error('ContactController', 'Error fetching contacts', error);
    res.status(500).json({ error: error.message });
  }
};

export const importContacts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    
    // Get the specified sheet or fallback to the first one
    let sheet = workbook.getWorksheet('WA-Download Group Phone Numbers') || workbook.worksheets[0];

    let imported = 0;
    const operations = [];

    sheet.eachRow((row, rowNumber) => {
      // Skip header row
      if (rowNumber === 1) return;

      const colA = row.getCell(1).value; // Country Code or Warning
      const colB = row.getCell(2).value; // Phone Number
      const colC = row.getCell(3).value; // Saved Name
      const colD = row.getCell(4).value; // Display Name
      const colE = row.getCell(5).value; // Is Admin?

      const phoneCell = colB ? String(colB).trim() : '';
      const savedName = colC ? String(colC).trim() : '';
      const displayName = colD ? String(colD).trim() : '';
      const isAdmin = String(colE).toLowerCase() === 'yes';

      if (!phoneCell) return;
      let phoneNumber = String(phoneCell).replace(/[^0-9]/g, '');

      if (!phoneNumber || phoneNumber.includes('NaN') || 
          String(phoneCell).toLowerCase().includes('free version') ||
          (colA && String(colA).toLowerCase().includes('free version'))) {
        return;
      }

      if (phoneNumber.length < 10) return;

      let name = displayName || savedName || 'User';

      let countryCode = null;
      if (colA && String(colA).startsWith('+')) {
        countryCode = String(colA).trim();
      } else if (phoneNumber.startsWith('91')) {
        countryCode = '+91'; // Fallback if missing but phone indicates India
      }

      operations.push(
        prisma.contact.upsert({
          where: { phoneNumber },
          update: {
            displayName: name,
            savedName,
            countryCode,
            isAdmin
          },
          create: {
            phoneNumber,
            countryCode,
            displayName: name,
            savedName,
            isAdmin,
            status: 'PENDING'
          }
        })
      );
    });

    // Execute all upserts in a single transaction for massive performance boost
    await prisma.$transaction(operations);
    imported = operations.length;

    logger.info('ContactController', `Successfully imported ${imported} contacts`);
    res.json({ message: `${imported} contacts imported successfully`, imported });
  } catch (error) {
    logger.error('ContactController', 'Error importing contacts', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteContact = async (req, res) => {
  try {
    await prisma.sendLog.deleteMany({ where: { contactId: Number(req.params.id) } });
    await prisma.contact.delete({ where: { id: Number(req.params.id) } });
    logger.info('ContactController', `Deleted contact ${req.params.id}`);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    logger.error('ContactController', `Error deleting contact ${req.params.id}`, error);
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
    logger.info('ContactController', 'All contacts reset to PENDING');
    res.json({ message: 'All contacts reset to PENDING' });
  } catch (error) {
    logger.error('ContactController', 'Error resetting contacts', error);
    res.status(500).json({ error: error.message });
  }
};
