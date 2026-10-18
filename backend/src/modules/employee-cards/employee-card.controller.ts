import type { Request, Response } from "express";
import { getError, parseId, toContentDisposition } from "../../shared/http-utils.js";
import { employeeCardService } from "./employee-card.service.js";
import { parseEmployeeCardInput, parseEmployeeCardQuery } from "./employee-card.validation.js";
import { generateEmployeeCardPdfBuffer } from "./employee-card.pdf.js";

export const employeeCardController = {
  async list(req: Request, res: Response) {
    try {
      const query = parseEmployeeCardQuery(req.query as Record<string, unknown>);
      const result = await employeeCardService.list(query);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ message: getError(error, "Failed to fetch employee cards") });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);
      const card = await employeeCardService.getById(id);
      if (!card) {
        return res.status(404).json({ message: "Employee card not found" });
      }
      return res.status(200).json(card);
    } catch (error) {
      return res.status(400).json({ message: getError(error, "Failed to fetch employee card") });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const input = parseEmployeeCardInput(req.body);
      const card = await employeeCardService.create(input);
      return res.status(201).json(card);
    } catch (error) {
      return res.status(400).json({ message: getError(error, "Failed to create employee card") });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);
      const input = parseEmployeeCardInput(req.body);
      const card = await employeeCardService.update(id, input);
      return res.status(200).json(card);
    } catch (error) {
      return res.status(400).json({ message: getError(error, "Failed to update employee card") });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);
      await employeeCardService.delete(id);
      return res.status(200).json({ message: "Employee card deleted successfully" });
    } catch (error) {
      return res.status(400).json({ message: getError(error, "Failed to delete employee card") });
    }
  },

  async exportPdf(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);
      const card = await employeeCardService.getById(id);
      if (!card) {
        return res.status(404).json({ message: "Employee card not found" });
      }

      const pdfBuffer = await generateEmployeeCardPdfBuffer(card);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader(
        "Content-Disposition",
        toContentDisposition(`employee-card-${card.name}.pdf`, "employee-card.pdf"),
      );

      return res.end(pdfBuffer);
    } catch (error) {
      console.error("[EmployeeCardController] exportPdf failed", error);
      return res.status(500).json({ message: getError(error, "Failed to export PDF") });
    }
  },
};
