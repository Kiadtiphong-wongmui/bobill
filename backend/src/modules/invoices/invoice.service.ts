import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { generateInvoicePdfStream } from "./invoice.pdf.js";
import { computeTotals, asMoney } from "../../shared/compute-totals.js";
import { nextDocumentNumber } from "../../shared/document-number.js";
import type { InvoiceInput } from "./invoice.types.js";

const nextInvoiceNumber = (prefixRaw?: string): Promise<string> =>
  nextDocumentNumber(
    prefixRaw,
    "RC-",
    async (startsWith) => {
      const last = await prisma.invoice.findFirst({
        where: { invoiceNumber: { startsWith } },
        orderBy: { invoiceNumber: "desc" },
        select: { invoiceNumber: true },
      });
      return last?.invoiceNumber ?? null;
    },
  );

const isUniqueConstraintInvoiceNumber = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const targets = error.meta?.target;
      if (Array.isArray(targets) && targets.includes("invoiceNumber")) {
        return true;
      }
      if (typeof targets === "string" && targets.includes("invoiceNumber")) {
        return true;
      }
    }
  }
  return false;
};

export const invoiceService = {
  async list(params: {
    page: number;
    pageSize: number;
    q?: string;
    seller?: string;
    buyer?: string;
    status?: "DRAFT" | "ISSUED" | "CANCELLED";
    from?: Date;
    to?: Date;
    sortBy?: "number" | "date" | "amount" | "seller" | "buyer";
    sortDir?: "asc" | "desc";
  }) {
    const {
      page,
      pageSize,
      q,
      seller,
      buyer,
      status,
      from,
      to,
      sortBy = "date",
      sortDir = "desc",
    } = params;

    const where = {
      ...(q
        ? {
            OR: [
              { invoiceNumber: { contains: q, mode: "insensitive" as const } },
              { sellerCompanyName: { contains: q, mode: "insensitive" as const } },
              { buyerCompanyName: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(seller ? { sellerCompanyName: { contains: seller, mode: "insensitive" as const } } : {}),
      ...(buyer ? { buyerCompanyName: { contains: buyer, mode: "insensitive" as const } } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            documentDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const orderBy =
      sortBy === "number"
        ? ({ invoiceNumber: sortDir } as const)
        : sortBy === "amount"
        ? ({ grandTotal: sortDir } as const)
        : sortBy === "seller"
        ? ({ sellerCompanyName: sortDir } as const)
        : sortBy === "buyer"
        ? ({ buyerCompanyName: sortDir } as const)
        : ({ documentDate: sortDir } as const);

    const [items, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: { items: { orderBy: { lineNo: "asc" } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  },

  async listRecent(limit = 5) {
    return prisma.invoice.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { items: { orderBy: { lineNo: "asc" } } },
    });
  },

  async getById(id: number) {
    return prisma.invoice.findUnique({
      where: { id },
      include: { items: { orderBy: { lineNo: "asc" } } },
    });
  },

  async create(input: InvoiceInput) {
    const { enrichedItems, subtotal, discountTotal, grandTotal } = computeTotals(
      input.items,
      input.discountTotal ?? 0,
    );

    const maxRetries = 3;
    let attempt = 0;

    while (true) {
      attempt++;
      const isManual = !!input.invoiceNumber?.trim();
      const invoiceNumber = (isManual && attempt === 1)
        ? input.invoiceNumber!.trim()
        : await nextInvoiceNumber(input.invoiceNumberPrefix);

      try {
        return await prisma.$transaction(async (tx) => {
          const data = {
            invoiceNumber,
            documentDate: new Date(input.documentDate),
            sellerCompanyName: input.sellerCompanyName,
            sellerAddress: input.sellerAddress,
            includeBuyer: input.includeBuyer,
            buyerCompanyName: input.includeBuyer ? input.buyerCompanyName ?? null : null,
            buyerAddress: input.includeBuyer ? input.buyerAddress ?? null : null,
            subtotal: asMoney(subtotal),
            discountTotal: asMoney(discountTotal),
            grandTotal: asMoney(grandTotal),
            status: input.status ?? "DRAFT",
            items: {
              create: enrichedItems.map((item) => ({
                lineNo: item.lineNo,
                description: item.description,
                quantity: asMoney(item.quantity),
                unitPrice: asMoney(item.unitPrice),
                lineTotal: asMoney(item.lineTotal),
              })),
            },
          } as const;

          const created = await tx.invoice.create({
            data: {
              ...data,
              paymentTerms: input.paymentTerms ?? null,
              creditDays: input.creditDays ?? null,
              sellerTaxId: input.sellerTaxId ?? null,
              sellerPhone: input.sellerPhone ?? null,
              sellerEmail: input.sellerEmail ?? null,
              buyerTaxId: input.includeBuyer ? (input.buyerTaxId ?? null) : null,
              note: input.note ?? null,
              amountInWords: input.amountInWords ?? null,
              signatures: input.signatures ?? Prisma.JsonNull,
            },
            include: { items: { orderBy: { lineNo: "asc" } } },
          });

          return created;
        });
      } catch (error) {
        if (isUniqueConstraintInvoiceNumber(error)) {
          if (isManual && attempt === 1) {
            throw new Error(`เลขที่ใบเสร็จ "${invoiceNumber}" นี้ถูกใช้งานไปแล้ว`);
          }
          if (attempt >= maxRetries) {
            throw new Error(`ไม่สามารถสร้างเลขที่ใบเสร็จอัตโนมัติได้เนื่องจากเกิดข้อขัดแย้งหลายครั้ง (เลขสุดท้ายที่ลองคือ "${invoiceNumber}")`);
          }
          console.warn(`[invoiceService] Unique constraint failed on invoiceNumber "${invoiceNumber}", retrying... (Attempt ${attempt}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, 50));
          continue;
        }
        throw error;
      }
    }
  },

  async update(id: number, input: InvoiceInput) {
    const { enrichedItems, subtotal, discountTotal, grandTotal } = computeTotals(
      input.items,
      input.discountTotal ?? 0,
    );

    try {
      return await prisma.$transaction(async (tx) => {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
        const invoiceNumber =
          input.invoiceNumber?.trim() || (await nextInvoiceNumber(input.invoiceNumberPrefix));
        return await tx.invoice.update({
          where: { id },
          data: {
            invoiceNumber,
            documentDate: new Date(input.documentDate),
            paymentTerms: input.paymentTerms ?? null,
            creditDays: input.creditDays ?? null,
            sellerCompanyName: input.sellerCompanyName,
            sellerAddress: input.sellerAddress,
            sellerTaxId: input.sellerTaxId ?? null,
            sellerPhone: input.sellerPhone ?? null,
            sellerEmail: input.sellerEmail ?? null,
            includeBuyer: input.includeBuyer,
            buyerCompanyName: input.includeBuyer ? input.buyerCompanyName ?? null : null,
            buyerAddress: input.includeBuyer ? input.buyerAddress ?? null : null,
            buyerTaxId: input.includeBuyer ? (input.buyerTaxId ?? null) : null,
            subtotal: asMoney(subtotal),
            discountTotal: asMoney(discountTotal),
            grandTotal: asMoney(grandTotal),
            note: input.note ?? null,
            amountInWords: input.amountInWords ?? null,
            signatures: input.signatures ?? Prisma.JsonNull,
            status: input.status ?? "DRAFT",
            items: {
              create: enrichedItems.map((item) => ({
                lineNo: item.lineNo,
                description: item.description,
                quantity: asMoney(item.quantity),
                unitPrice: asMoney(item.unitPrice),
                lineTotal: asMoney(item.lineTotal),
              })),
            },
          },
          include: { items: { orderBy: { lineNo: "asc" } } },
        });
      });
    } catch (error) {
      if (isUniqueConstraintInvoiceNumber(error)) {
        throw new Error(`เลขที่ใบเสร็จนี้ถูกใช้งานไปแล้ว`);
      }
      throw error;
    }
  },

  async cancel(id: number) {
    return prisma.invoice.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { items: { orderBy: { lineNo: "asc" } } },
    });
  },

  async issue(id: number) {
    return prisma.invoice.update({
      where: { id },
      data: { status: "ISSUED" },
      include: { items: { orderBy: { lineNo: "asc" } } },
    });
  },

  async getStats(selectedYear?: number) {
    const invoices = await prisma.invoice.findMany({
      select: {
        status: true,
        grandTotal: true,
        documentDate: true,
      },
    });

    let totalSales = 0;
    let issuedCount = 0;
    let draftCount = 0;
    let cancelledCount = 0;

    // Detect all available calendar years from the database
    const yearsSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    yearsSet.add(currentYear); // default include current year

    for (const inv of invoices) {
      yearsSet.add(new Date(inv.documentDate).getFullYear());
    }
    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    // Auto-select year: use requested selectedYear if valid, or default to the latest year with data
    const year = selectedYear && availableYears.includes(selectedYear)
      ? selectedYear
      : (availableYears[0] ?? currentYear);

    // Pre-populate 12-month calendar skeleton (January to December) for the selected year
    const monthlyStats: Array<{
      year: number;
      month: number;
      monthName: string;
      issuedCount: number;
      draftCount: number;
      cancelledCount: number;
      totalSales: number;
    }> = [];

    const monthNamesThai = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];

    for (let m = 0; m < 12; m++) {
      monthlyStats.push({
        year,
        month: m + 1,
        monthName: monthNamesThai[m] ?? "",
        issuedCount: 0,
        draftCount: 0,
        cancelledCount: 0,
        totalSales: 0,
      });
    }

    for (const inv of invoices) {
      const amount = Number(inv.grandTotal);
      const docDate = new Date(inv.documentDate);
      const docYear = docDate.getFullYear();
      const docMonth = docDate.getMonth(); // 0 to 11

      if (docYear === year) {
        if (inv.status === "ISSUED") {
          totalSales += amount;
          issuedCount++;
        } else if (inv.status === "DRAFT") {
          draftCount++;
        } else if (inv.status === "CANCELLED") {
          cancelledCount++;
        }

        const target = monthlyStats[docMonth];
        if (target) {
          if (inv.status === "ISSUED") {
            target.issuedCount++;
            target.totalSales += amount;
          } else if (inv.status === "DRAFT") {
            target.draftCount++;
          } else if (inv.status === "CANCELLED") {
            target.cancelledCount++;
          }
        }
      }
    }

    // Format all totalSales in monthlyStats to 2 decimal places
    const formattedMonthlyStats = monthlyStats.map(m => ({
      ...m,
      totalSales: Number(m.totalSales.toFixed(2))
    }));

    return {
      totalSales: Number(totalSales.toFixed(2)),
      issuedCount,
      draftCount,
      cancelledCount,
      selectedYear: year,
      availableYears,
      monthlyStats: formattedMonthlyStats,
    };
  },

  async exportPdfStream(id: number, stream: NodeJS.WritableStream, useAttachment?: boolean) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: { orderBy: { lineNo: "asc" } } },
    });
    if (!invoice) {
      return null;
    }

    generateInvoicePdfStream(invoice, stream, useAttachment);
    return { filename: `${invoice.invoiceNumber}.pdf` };
  },
};
