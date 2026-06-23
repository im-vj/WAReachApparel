import prisma from '../prismaClient.js';

export const getAllLogs = async (req, res) => {
  try {
    const logs = await prisma.sendLog.findMany({
      include: { contact: true },
      orderBy: { sentAt: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStatusCounts = async (req, res) => {
  try {
    const total = await prisma.contact.count();
    const pending = await prisma.contact.count({ where: { status: 'PENDING' } });
    const sent = await prisma.contact.count({ where: { status: 'SENT' } });
    const failed = await prisma.contact.count({ where: { status: 'FAILED' } });
    const skipped = await prisma.contact.count({ where: { status: 'SKIPPED' } });
    
    res.json({ total, pending, sent, failed, skipped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
