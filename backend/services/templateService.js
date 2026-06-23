import prisma from '../prismaClient.js';

export const initTemplates = async () => {
  const count = await prisma.messageTemplate.count();
  if (count === 0) {
    await prisma.messageTemplate.create({
      data: {
        name: 'Cordestitch Outreach',
        content: `Hi {name} 👋\n\nCame across your profile in the Apparel Business Zone group. I'm reaching out from *Cordestitch* — we specialise in *trouser & pants manufacturing* (FOB + CMT/Job Work).\n\nIf you're sourcing production for bottoms — chinos, formal trousers, cargo pants, or denim — we'd love to be your manufacturing partner.\n\n✅ End-to-end FOB production\n✅ CMT / Job Work accepted\n✅ Consistent quality, on-time delivery\n✅ Export-ready output\n\nExplore our capabilities: manufacture.cordestitch.com\n\nHappy to share our brochure or discuss requirements. Let me know! 🙏`,
        metaTemplateName: 'cordestitch_outreach'
      }
    });
  }
};
