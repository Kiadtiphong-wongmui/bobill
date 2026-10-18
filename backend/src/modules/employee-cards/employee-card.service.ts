import { prisma } from "../../config/prisma.js";
import type { EmployeeCardInput } from "./employee-card.types.js";

export const employeeCardService = {
  async list(params: {
    page: number;
    pageSize: number;
    q?: string | undefined;
  }) {
    const { page, pageSize, q } = params;

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { workPermitNo: { contains: q, mode: "insensitive" as const } },
            { employerName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [items, total] = await prisma.$transaction([
      prisma.employeeCard.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.employeeCard.count({ where }),
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

  async getById(id: number) {
    return prisma.employeeCard.findUnique({
      where: { id },
    });
  },

  async create(data: EmployeeCardInput) {
    return prisma.employeeCard.create({
      data: {
        cardHeader: data.cardHeader,
        photoUrl: data.photoUrl ?? null,
        name: data.name,
        nationality: data.nationality,
        workPermitNo: data.workPermitNo,
        instructions: data.instructions,
        employerName: data.employerName,
        address: data.address,
        issueDate: new Date(data.issueDate),
        expiryDate: new Date(data.expiryDate),
        signerName: data.signerName,
        signerPosition: data.signerPosition,
        telephone: data.telephone,
      },
    });
  },

  async update(id: number, data: Partial<EmployeeCardInput>) {
    const updateData: Record<string, any> = {};

    const fields = [
      "cardHeader",
      "photoUrl",
      "name",
      "nationality",
      "workPermitNo",
      "instructions",
      "employerName",
      "address",
      "signerName",
      "signerPosition",
      "telephone",
    ];

    fields.forEach((field) => {
      if (data[field as keyof EmployeeCardInput] !== undefined) {
        updateData[field] = data[field as keyof EmployeeCardInput];
      }
    });

    if (data.issueDate !== undefined) {
      updateData.issueDate = new Date(data.issueDate);
    }
    if (data.expiryDate !== undefined) {
      updateData.expiryDate = new Date(data.expiryDate);
    }

    return prisma.employeeCard.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(id: number) {
    return prisma.employeeCard.delete({
      where: { id },
    });
  },
};
