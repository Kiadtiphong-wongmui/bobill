import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { asMoney, computeTotals } from "../../shared/compute-totals.js";
import { nextDocumentNumber } from "../../shared/document-number.js";
import { arabicToThaiBahtText } from "../../utils/document-calculator.js";
import { invoiceService } from "../invoices/invoice.service.js";
import { generateQuotationPdfStream } from "./quotation.pdf.js";
import type { QuotationListQuery } from "./quotation.query.js";
import { QUOTATION_TRANSITIONS } from "./quotation.types.js";
import type { QuotationInput, QuotationStatus } from "./quotation.types.js";

const include = { items: { orderBy: { lineNo: "asc" } } } as const;

const MONTH_NAMES_THAI = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

export class QuotationNotFoundError extends Error {
  constructor() {
    super("Quotation not found");
  }
}

const nextQuotationNumber = (prefixRaw?: string): Promise<string> =>
  nextDocumentNumber(prefixRaw, "QT-", async (startsWith) => {
    const last = await prisma.quotation.findFirst({
      where: { quotationNumber: { startsWith } },
      orderBy: { quotationNumber: "desc" },
      select: { quotationNumber: true },
    });
    return last?.quotationNumber ?? null;
  });

const isUniqueConstraintQuotationNumber = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const targets = error.meta?.target;
    if (Array.isArray(targets)) return targets.includes("quotationNumber");
    if (typeof targets === "string") return targets.includes("quotationNumber");
  }
  return false;
};

const startOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * Lazily moves SENT quotations whose validity has passed to EXPIRED.
 * Runs before reads so no scheduler is needed.
 */
const expireOverdue = async (): Promise<void> => {
  await prisma.quotation.updateMany({
    where: { status: "SENT", validUntil: { lt: startOfToday() } },
    data: { status: "EXPIRED" },
  });
};

/** Totals + the persisted fields derived from them (used by both create and update). */
const buildTotals = (input: QuotationInput) => {
  const vatRate = input.vatEnabled ? input.vatRate : 0;
  const totals = computeTotals(input.items, input.discountTotal ?? 0, vatRate);
  return {
    enrichedItems: totals.enrichedItems,
    fields: {
      subtotal: asMoney(totals.subtotal),
      discountTotal: asMoney(totals.discountTotal),
      vatEnabled: input.vatEnabled,
      vatRate: asMoney(input.vatRate),
      vatAmount: asMoney(totals.vatTotal),
      grandTotal: asMoney(totals.grandTotal),
      amountInWords: arabicToThaiBahtText(totals.grandTotal),
    },
  };
};

const buildDetailFields = (input: QuotationInput) => ({
  documentDate: new Date(input.documentDate),
  validUntil: new Date(input.validUntil),
  paymentTerms: input.paymentTerms ?? null,
  sellerCompanyName: input.sellerCompanyName,
  sellerAddress: input.sellerAddress,
  sellerTaxId: input.sellerTaxId ?? null,
  sellerPhone: input.sellerPhone ?? null,
  sellerEmail: input.sellerEmail ?? null,
  includeBuyer: input.includeBuyer,
  buyerCompanyName: input.includeBuyer ? input.buyerCompanyName ?? null : null,
  buyerAddress: input.includeBuyer ? input.buyerAddress ?? null : null,
  buyerTaxId: input.includeBuyer ? input.buyerTaxId ?? null : null,
  note: input.note ?? null,
  signatures: input.signatures ?? Prisma.JsonNull,
});

const toItemCreates = (items: ReturnType<typeof buildTotals>["enrichedItems"]) =>
  items.map((item) => ({
    lineNo: item.lineNo,
    description: item.description,
    quantity: asMoney(item.quantity),
    unitPrice: asMoney(item.unitPrice),
    lineTotal: asMoney(item.lineTotal),
  }));

export const quotationService = {
  async list(params: QuotationListQuery) {
    await expireOverdue();
    const { page, pageSize, q, seller, buyer, status, from, to, sortBy, sortDir } = params;

    const where: Prisma.QuotationWhereInput = {
      ...(q
        ? {
            OR: [
              { quotationNumber: { contains: q, mode: "insensitive" } },
              { sellerCompanyName: { contains: q, mode: "insensitive" } },
              { buyerCompanyName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(seller ? { sellerCompanyName: { contains: seller, mode: "insensitive" } } : {}),
      ...(buyer ? { buyerCompanyName: { contains: buyer, mode: "insensitive" } } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? { documentDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    };

    const orderBy: Prisma.QuotationOrderByWithRelationInput =
      sortBy === "number"
        ? { quotationNumber: sortDir }
        : sortBy === "amount"
        ? { grandTotal: sortDir }
        : sortBy === "seller"
        ? { sellerCompanyName: sortDir }
        : sortBy === "buyer"
        ? { buyerCompanyName: sortDir }
        : sortBy === "validUntil"
        ? { validUntil: sortDir }
        : { documentDate: sortDir };

    const [items, total] = await prisma.$transaction([
      prisma.quotation.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include,
      }),
      prisma.quotation.count({ where }),
    ]);

    return {
      items,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  },

  async listRecent(limit = 5) {
    await expireOverdue();
    return prisma.quotation.findMany({ take: limit, orderBy: { createdAt: "desc" }, include });
  },

  async getById(id: number) {
    await expireOverdue();
    return prisma.quotation.findUnique({ where: { id }, include });
  },

  async create(input: QuotationInput) {
    const { enrichedItems, fields } = buildTotals(input);
    const maxRetries = 3;
    const isManual = !!input.quotationNumber?.trim();

    for (let attempt = 1; ; attempt++) {
      const quotationNumber =
        isManual && attempt === 1
          ? input.quotationNumber!.trim()
          : await nextQuotationNumber(input.quotationNumberPrefix);

      try {
        return await prisma.quotation.create({
          data: {
            quotationNumber,
            ...buildDetailFields(input),
            ...fields,
            status: "DRAFT",
            items: { create: toItemCreates(enrichedItems) },
          },
          include,
        });
      } catch (error) {
        if (!isUniqueConstraintQuotationNumber(error)) throw error;
        if (isManual && attempt === 1) {
          throw new Error(`เลขที่ใบเสนอราคา "${quotationNumber}" นี้ถูกใช้งานไปแล้ว`);
        }
        if (attempt >= maxRetries) {
          throw new Error(
            `ไม่สามารถสร้างเลขที่ใบเสนอราคาอัตโนมัติได้เนื่องจากเกิดข้อขัดแย้งหลายครั้ง (เลขสุดท้ายที่ลองคือ "${quotationNumber}")`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
  },

  /** Only DRAFT quotations are editable. The number is kept unless a different one is supplied. */
  async update(id: number, input: QuotationInput) {
    const { enrichedItems, fields } = buildTotals(input);

    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.quotation.findUnique({
          where: { id },
          select: { status: true, quotationNumber: true },
        });
        if (!existing) throw new QuotationNotFoundError();
        if (existing.status !== "DRAFT") {
          throw new Error("แก้ไขได้เฉพาะใบเสนอราคาที่เป็นฉบับร่าง (DRAFT) เท่านั้น");
        }

        await tx.quotationItem.deleteMany({ where: { quotationId: id } });
        return tx.quotation.update({
          where: { id },
          data: {
            quotationNumber: input.quotationNumber?.trim() || existing.quotationNumber,
            ...buildDetailFields(input),
            ...fields,
            items: { create: toItemCreates(enrichedItems) },
          },
          include,
        });
      });
    } catch (error) {
      if (isUniqueConstraintQuotationNumber(error)) {
        throw new Error("เลขที่ใบเสนอราคานี้ถูกใช้งานไปแล้ว");
      }
      throw error;
    }
  },

  /** Moves a quotation to `to` if the transition is allowed from its current status. */
  async transition(id: number, to: QuotationStatus) {
    await expireOverdue();
    const existing = await prisma.quotation.findUnique({
      where: { id },
      select: { status: true, validUntil: true },
    });
    if (!existing) throw new QuotationNotFoundError();

    const from = existing.status as QuotationStatus;
    if (!QUOTATION_TRANSITIONS[from].includes(to)) {
      throw new Error(`ไม่สามารถเปลี่ยนสถานะจาก ${from} เป็น ${to} ได้`);
    }
    if (to === "SENT" && existing.validUntil < startOfToday()) {
      throw new Error("วันหมดอายุของใบเสนอราคาผ่านไปแล้ว กรุณาแก้ไขวันหมดอายุก่อนส่ง");
    }

    // Guard on the status we read so concurrent transitions cannot both win.
    const result = await prisma.quotation.updateMany({ where: { id, status: from }, data: { status: to } });
    if (result.count === 0) {
      throw new Error("สถานะของใบเสนอราคาถูกเปลี่ยนไปแล้ว กรุณารีเฟรชแล้วลองใหม่");
    }
    return prisma.quotation.findUniqueOrThrow({ where: { id }, include });
  },

  /** Hard delete, only allowed while the quotation is still a DRAFT. */
  async remove(id: number) {
    const existing = await prisma.quotation.findUnique({ where: { id }, select: { status: true } });
    if (!existing) throw new QuotationNotFoundError();
    if (existing.status !== "DRAFT") {
      throw new Error("ลบได้เฉพาะใบเสนอราคาที่เป็นฉบับร่าง (DRAFT) เท่านั้น");
    }
    await prisma.quotation.delete({ where: { id } });
  },

  /**
   * Creates a DRAFT invoice from an ACCEPTED quotation. The invoice has no VAT column,
   * so VAT is carried as an extra line item and the discount is kept, which makes the
   * invoice grand total equal the quotation grand total.
   */
  async convertToInvoice(id: number) {
    await expireOverdue();
    const quotation = await prisma.quotation.findUnique({ where: { id }, include });
    if (!quotation) throw new QuotationNotFoundError();
    if (quotation.status !== "ACCEPTED") {
      throw new Error("แปลงเป็นใบแจ้งหนี้ได้เฉพาะใบเสนอราคาที่ลูกค้าตอบรับแล้ว (ACCEPTED)");
    }
    if (quotation.convertedInvoiceId !== null) {
      throw new Error("ใบเสนอราคานี้ถูกแปลงเป็นใบแจ้งหนี้ไปแล้ว");
    }

    const items = quotation.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }));
    const vatAmount = Number(quotation.vatAmount);
    if (quotation.vatEnabled && vatAmount > 0) {
      items.push({
        description: `ภาษีมูลค่าเพิ่ม ${Number(quotation.vatRate)}%`,
        quantity: 1,
        unitPrice: vatAmount,
      });
    }

    const reference = `อ้างอิงใบเสนอราคาเลขที่ ${quotation.quotationNumber}`;
    const invoice = await invoiceService.create({
      documentDate: new Date().toISOString(),
      sellerCompanyName: quotation.sellerCompanyName,
      sellerAddress: quotation.sellerAddress,
      includeBuyer: quotation.includeBuyer,
      discountTotal: Number(quotation.discountTotal),
      amountInWords: arabicToThaiBahtText(Number(quotation.grandTotal)),
      note: quotation.note ? `${reference}\n${quotation.note}` : reference,
      status: "DRAFT",
      items,
      ...(quotation.paymentTerms ? { paymentTerms: quotation.paymentTerms } : {}),
      ...(quotation.sellerTaxId ? { sellerTaxId: quotation.sellerTaxId } : {}),
      ...(quotation.sellerPhone ? { sellerPhone: quotation.sellerPhone } : {}),
      ...(quotation.sellerEmail ? { sellerEmail: quotation.sellerEmail } : {}),
      ...(quotation.buyerCompanyName ? { buyerCompanyName: quotation.buyerCompanyName } : {}),
      ...(quotation.buyerAddress ? { buyerAddress: quotation.buyerAddress } : {}),
      ...(quotation.buyerTaxId ? { buyerTaxId: quotation.buyerTaxId } : {}),
    });

    // Claim the quotation atomically; if another request converted it first, undo our invoice.
    const claimed = await prisma.quotation.updateMany({
      where: { id, convertedInvoiceId: null },
      data: { convertedInvoiceId: invoice.id },
    });
    if (claimed.count === 0) {
      await prisma.invoice.delete({ where: { id: invoice.id } });
      throw new Error("ใบเสนอราคานี้ถูกแปลงเป็นใบแจ้งหนี้ไปแล้ว");
    }

    const updated = await prisma.quotation.findUniqueOrThrow({ where: { id }, include });
    return { quotation: updated, invoice };
  },

  async getStats(selectedYear?: number) {
    await expireOverdue();
    const quotations = await prisma.quotation.findMany({
      select: { status: true, grandTotal: true, documentDate: true },
    });

    const currentYear = new Date().getFullYear();
    const yearsSet = new Set<number>([currentYear]);
    for (const q of quotations) yearsSet.add(new Date(q.documentDate).getFullYear());
    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);
    const year =
      selectedYear && availableYears.includes(selectedYear) ? selectedYear : (availableYears[0] ?? currentYear);

    const emptyCounts = (): Record<QuotationStatus, number> => ({
      DRAFT: 0,
      SENT: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      EXPIRED: 0,
    });

    const counts = emptyCounts();
    let totalAccepted = 0;
    const monthlyStats = MONTH_NAMES_THAI.map((monthName, index) => ({
      year,
      month: index + 1,
      monthName,
      counts: emptyCounts(),
      totalAccepted: 0,
    }));

    for (const q of quotations) {
      const docDate = new Date(q.documentDate);
      if (docDate.getFullYear() !== year) continue;
      const status = q.status as QuotationStatus;
      const amount = Number(q.grandTotal);
      counts[status]++;
      if (status === "ACCEPTED") totalAccepted += amount;

      const month = monthlyStats[docDate.getMonth()];
      if (month) {
        month.counts[status]++;
        if (status === "ACCEPTED") month.totalAccepted += amount;
      }
    }

    return {
      totalAccepted: Number(totalAccepted.toFixed(2)),
      counts,
      selectedYear: year,
      availableYears,
      monthlyStats: monthlyStats.map((m) => ({ ...m, totalAccepted: Number(m.totalAccepted.toFixed(2)) })),
    };
  },

  async exportPdfStream(id: number, stream: NodeJS.WritableStream) {
    const quotation = await this.getById(id);
    if (!quotation) return null;

    generateQuotationPdfStream(quotation, stream);
    return { filename: `${quotation.quotationNumber}.pdf` };
  },
};
