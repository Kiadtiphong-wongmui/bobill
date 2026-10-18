import type { Request, Response } from "express";

import { getError, parseId, toContentDisposition } from "../../shared/http-utils.js";
import { invoiceService } from "./invoice.service.js";
import { parseInvoiceListQuery, parseInvoiceRecentLimit } from "./invoice.query.js";
import { parseInvoiceInput } from "./invoice.validation.js";

export const invoiceController = {
  async list(req: Request, res: Response) {
    const query = parseInvoiceListQuery(req.query);
    const invoices = await invoiceService.list(query);
    return res.status(200).json(invoices);
  },

  async recent(req: Request, res: Response) {
    const limit = parseInvoiceRecentLimit(req.query);
    const invoices = await invoiceService.listRecent(limit);
    return res.status(200).json(invoices);
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);
      const invoice = await invoiceService.getById(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      return res.status(200).json(invoice);
    } catch (error) {
      return res.status(400).json({ message: getError(error, "Invalid id") });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const input = parseInvoiceInput(req.body);
      const invoice = await invoiceService.create(input);
      return res.status(201).json(invoice);
    } catch (error) {
      return res.status(400).json({ message: getError(error, "Unable to create invoice") });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);
      const input = parseInvoiceInput(req.body);
      const invoice = await invoiceService.update(id, input);
      return res.status(200).json(invoice);
    } catch (error) {
      return res.status(400).json({ message: getError(error, "Unable to update invoice") });
    }
  },

  async cancel(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);
      const invoice = await invoiceService.cancel(id);
      return res.status(200).json(invoice);
    } catch (error) {
      return res.status(400).json({ message: getError(error, "Unable to cancel invoice") });
    }
  },

  async issue(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);
      const invoice = await invoiceService.issue(id);
      return res.status(200).json(invoice);
    } catch (error) {
      return res.status(400).json({ message: getError(error, "Unable to issue invoice") });
    }
  },

  async stats(req: Request, res: Response) {
    try {
      const yearParam = req.query.year ? Number(req.query.year) : undefined;
      const statsData = await invoiceService.getStats(yearParam);
      return res.status(200).json(statsData);
    } catch (error) {
      return res.status(400).json({ message: getError(error, "Unable to load invoice statistics") });
    }
  },

  async exportPdf(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);
      const attachmentParam = req.query.use_attachment;
      if (attachmentParam !== undefined && attachmentParam !== "true" && attachmentParam !== "false") {
        return res.status(400).json({ message: "use_attachment must be true or false" });
      }
      const useAttachment = attachmentParam === undefined ? undefined : attachmentParam === "true";
      const invoice = await invoiceService.getById(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", toContentDisposition(`${invoice.invoiceNumber}.pdf`));
      await invoiceService.exportPdfStream(id, res, useAttachment);
    } catch (error) {
      console.error("[ERROR] [InvoiceController] Invoice PDF export failed", {
        invoiceId: req.params.id,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      if (!res.headersSent) {
        return res.status(400).json({ message: getError(error, "Unable to export PDF") });
      }
    }
  },
};
