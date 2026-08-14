-- CreateTable
CREATE TABLE "EmployeeCard" (
    "id" SERIAL NOT NULL,
    "cardHeader" TEXT NOT NULL,
    "photoUrl" TEXT,
    "name" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "workPermitNo" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "employerName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerPosition" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeCard_pkey" PRIMARY KEY ("id")
);
