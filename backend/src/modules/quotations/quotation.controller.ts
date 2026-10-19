import type { Request, Response } from "express";

import { getError, parseId, toContentDisposition } from "../../shared/http-utils.js";
import { parseQuotationListQuery, parseQuotationRecentLimit } from "./quotation.query.js";
import { QuotationNotFoundError, quotationService } from "./quotation.service.js";
import type { QuotationStatus } from "./quotation.types.js";
import { parseQuotationInput } from "./quotation.validation.js";

const fail = (res: Response, error: unknown, fallback: string) =>
  res
    .status(error instanceof QuotationNotFoundError ? 404 : 400)
    .json({ message: getError(error, fallback) });

const transitionHandler =
  (to: QuotationStatus, fallback: string) => async (req: Request, res: Response) => {
    try {
      const quotation = await quotationService.transition(parseId(req.params.id), to);
      return res.status(200).json(quotation);
    } catch (error) {
      return fail(res, error, fallback);
    }
  };

export const quotationController = {
  async list(req: Request, res: Response) {
    try {
      const result = await quotationService.list(parseQuotationListQuery(req.query));
      return res.status(200).json(result);
    } catch (error) {
      return fail(res, error, "Unable to load quotations");
    }
  },

  async recent(req: Request, res: Response) {
    try {
      const result = await quotationService.listRecent(parseQuotationRecentLimit(req.query));
      return res.status(200).json(result);
    } catch (error) {
      return fail(res, error, "Unable to load recent quotations");
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const quotation = await quotationService.getById(parseId(req.params.id));
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      return res.status(200).json(quotation);
    } catch (error) {
      return fail(res, error, "Invalid id");
    }
  },

  async create(req: Request, res: Response) {
    try {
      const quotation = await quotationService.create(parseQuotationInput(req.body));
      return res.status(201).json(quotation);
    } catch (error) {
      return fail(res, error, "Unable to create quotation");
    }
  },

  async update(req: Request, res: Response) {
    try {
      const quotation = await quotationService.update(parseId(req.params.id), parseQuotationInput(req.body));
      return res.status(200).json(quotation);
    } catch (error) {
      return fail(res, error, "Unable to update quotation");
    }
  },

  send: transitionHandler("SENT", "Unable to send quotation"),
  accept: transitionHandler("ACCEPTED", "Unable to accept quotation"),
  reject: transitionHandler("REJECTED", "Unable to reject quotation"),

  async convertToInvoice(req: Request, res: Response) {
    try {
      const result = await quotationService.convertToInvoice(parseId(req.params.id));
      return res.status(201).json(result);
    } catch (error) {
      return fail(res, error, "Unable to convert quotation to invoice");
    }
  },

  async remove(req: Request, res: Response) {
    try {
      await quotationService.remove(parseId(req.params.id));
      return res.status(204).send();
    } catch (error) {
      return fail(res, error, "Unable to delete quotation");
    }
  },

  async stats(req: Request, res: Response) {
    try {
      const yearParam = req.query.year ? Number(req.query.year) : undefined;
      const stats = await quotationService.getStats(yearParam);
      return res.status(200).json(stats);
    } catch (error) {
      return fail(res, error, "Unable to load quotation statistics");
    }
  },

  async exportPdf(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);
      const quotation = await quotationService.getById(id);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", toContentDisposition(`${quotation.quotationNumber}.pdf`));
      await quotationService.exportPdfStream(id, res);
    } catch (error) {
      console.error("[ERROR] [QuotationController] Quotation PDF export failed", {
        quotationId: req.params.id,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      if (!res.headersSent) {
        return fail(res, error, "Unable to export PDF");
      }
    }
  },
};
