# BoBill Project - คู่มือสำหรับนักพัฒนาและเอเจนต์ AI (Developer & AI Agent Guide)

เอกสารนี้รวบรวมรายละเอียดโครงสร้าง ข้อมูลเชิงเทคนิค และแนวทางการพัฒนาของโปรเจค **BoBill** (ระบบจัดการใบเสร็จ/ใบกำกับภาษี - Invoice/Billing Management System) เพื่อให้ทีมพัฒนาและ AI Agents สามารถเริ่มต้นทำงานและแก้ไขระบบได้อย่างถูกต้องและรวดเร็ว

---

## 1. ข้อมูลภาพรวมของโปรเจค (Project Overview)

**BoBill** เป็นเว็บแอปพลิเคชันแบบ Full-stack สำหรับจัดการและออกเอกสารใบแจ้งหนี้ (Invoices/Billing) โดยรองรับการจัดการสิทธิ์การเข้าใช้งาน (Roles: `ADMIN`, `USER`), สถานะเอกสาร (`DRAFT`, `ISSUED`, `CANCELLED`), การคำนวณราคาสินค้า ส่วนลด ยอดรวม และการสร้างไฟล์ PDF ใบเสร็จภาษาไทยได้อย่างถูกต้อง

### โครงสร้างระบบ (Architecture Layout)
โปรเจคนี้แบ่งโครงสร้างออกเป็นส่วนหลักๆ ดังนี้:
- **`backend/`**: Node.js + Express + Prisma ORM (PostgreSQL) สำหรับให้บริการ RESTful APIs
- **`frontend/`**: Next.js (App Router) + Tailwind CSS v4 สำหรับเว็บอินเตอร์เฟส
- **`test/`**: ชุดทดสอบ API แบบ Integration Test โดยใช้ Bruno API Collection
- **`docker-compose.dev.yml` / `Makefile`**: ระบบจัดการ Container สำหรับพัฒนาโปรเจคในเครื่อง (Local Development)

---

## 2. ข้อมูลเชิงเทคนิค (Tech Stack Details)

### 🔹 Backend
- **Core Runtime & Framework**: Node.js v22 (Alpine Docker Image) พร้อมการกำหนดค่าประเภท Module (`"type": "module"`) และใช้ Express.js (v5.2.1)
- **Language**: TypeScript (ใช้ `tsconfig.json` และรันไฟล์พัฒนาผ่าน `tsx`/`nodemon`)
- **Database ORM**: Prisma ORM (v7.8.0)
- **Database Engine**: PostgreSQL 16 (ผ่าน Docker Container)
- **Libraries สำคัญ**:
  - `pdfkit` (v0.18.0) พร้อมฟอนต์ภาษาไทย (`@fontsource/sarabun`, `font-th-sarabun-new`, `@openfonts/fahkwang_thai`) เพื่อเรนเดอร์ PDF เป็นภาษาไทย
  - `bcryptjs` สำหรับการแฮชรหัสผ่านของผู้ใช้
  - `multer` สำหรับจัดการ File Upload

### 🔹 Frontend
- **Framework**: Next.js v16.2.4 (React v19.2.4)
- **Styling**: Tailwind CSS v4.x (ใช้ `@tailwindcss/postcss` และระบุคอนฟิกใน `postcss.config.mjs`)
- **Language**: TypeScript (v5.x)
- **Development Tooling**: ใช้ `--webpack` ในการรัน Dev Server (`next dev --webpack`) เพื่ออำนวยความสะดวกเรื่องการทำ Hot-reload และ Polling บน Docker

### 🔹 Database Schema (Prisma Models)
ระบบมี Database Schema หลักอยู่ 4 ตาราง/โมเดล ดังนี้ (อ้างอิงจาก `backend/prisma/schema.prisma`):
1. **`User`**: ข้อมูลบัญชีผู้ใช้
   - ฟิลด์หลัก: `id`, `username`, `password`, `createdAt`, `updatedAt`, `roles` (เป็น Enum: `ADMIN`, `USER` โดยค่าเริ่มต้นคือ `USER`)
2. **`Invoice`**: ข้อมูลส่วนหัวและข้อมูลรวมของใบแจ้งหนี้
   - ฟิลด์หลัก: `invoiceNumber` (Unique), `documentDate`, `paymentTerms`, `creditDays`, ข้อมูลผู้ขาย (Seller), ข้อมูลผู้ซื้อ (Buyer), ราคารวม (`subtotal`, `discountTotal`, `grandTotal`), `note`, `status` (Enum: `DRAFT`, `ISSUED`, `CANCELLED`), `signatures` (Json)
3. **`InvoiceItem`**: รายละเอียดรายการสินค้าในแต่ละใบแจ้งหนี้
   - ฟิลด์หลัก: `id`, `invoiceId`, `lineNo` (เป็น Unique คู่กับ `invoiceId`), `description`, `quantity`, `unitPrice`, `lineTotal`
   - ความสัมพันธ์: `Relation` เชื่อมโยงกับ `Invoice` แบบ `Cascade` ลบใบแจ้งหนี้หลักแล้วจะลบรายการย่อยทั้งหมด
4. **`EmployeeCard`**: ข้อมูลบัตรประจำตัวพนักงานขนาด 7.2 × 10.3 ซม. ทั้งสองด้าน
   - ฟิลด์หลัก: `id`, `cardHeader`, `photoUrl`, `name`, `nationality`, `workPermitNo`, `instructions`, `employerName`, `address`, `issueDate`, `expiryDate`, `signerName`, `signerPosition`, `telephone`

---

## 3. การเตรียมสภาพแวดล้อมเพื่อเริ่มต้นพัฒนา (Local Development Setup)

โปรเจคนี้จัดเตรียมเครื่องมือ `Makefile` และ `docker-compose.dev.yml` เพื่อให้สามารถเริ่มงานได้ทันที

### การตั้งค่า Environment Variables
สร้างไฟล์ `.env` ที่ root folder จากไฟล์ต้นแบบ `.env.example`:
```bash
cp .env.example .env
```
และระบุรหัสผ่าน/การเชื่อมต่อให้เหมาะสม เช่น:
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `DATABASE_URL` (ใช้เชื่อมโยงกับฐานข้อมูล PostgreSQL)
- `AUTH_SECRET` (สำหรับใช้เซ็นชื่อ Token หรือ Session)
- `NGROK_AUTHTOKEN`, `NGROK_URL` (ในกรณีที่ต้องการรันการทดสอบ/แชร์ลิงก์ภายนอกผ่าน ngrok)

### คำสั่งจัดการ Container (ผ่าน Makefile)
ที่ **root folder** ของโปรเจค สามารถใช้คำสั่งต่อไปนี้:

* **เริ่มรันระบบทั้งหมดในโหมด Dev** (สร้าง Container, รัน DB, Backend, Frontend):
  ```bash
  make dev
  ```
  *(จะรัน Backend ในพอร์ต `3001:3000` และ Frontend ในพอร์ต `3000:3000`)*
* **หยุดการทำงานของระบบ**:
  ```bash
  make dev-stop
  ```
* **เริ่มระบบพร้อมเปิด ngrok tunnel**:
  ```bash
  make dev-ngrok
  ```
* **หยุดการทำงานรวมถึง ngrok**:
  ```bash
  make dev-ngrok-stop
  ```
* **ลบ Container, Volume, Network และ Image ในเครื่องแบบสะอาดหมดจด**:
  ```bash
  make dev-clean
  ```

### 🔹 การตั้งค่า pgAdmin อัตโนมัติ (Automated pgAdmin Configuration)
ระบบได้รับการตั้งค่าให้พร้อมใช้งานเมื่อเปิด pgAdmin (พอร์ต `5050`):
1. **Desktop Mode**: pgAdmin ทำงานใน Desktop Mode ไม่ต้องล็อกอินอีเมล/รหัสผ่านและเข้าสู่ Dashboard ได้ทันที
2. **Auto-Import Server**: ระบบจะนำเข้าการเชื่อมต่อฐานข้อมูล `bobill` (ชื่อเซิร์ฟเวอร์ `bobill`) ให้โดยอัตโนมัติจากไฟล์ `servers.json`
3. **No Master Password**: ไม่ต้องป้อนรหัสผ่านหลัก (Master Password) และไม่ต้องป้อนรหัสผ่านฐานข้อมูล เนื่องจากมีการแมปและบันทึกรหัสผ่านจาก `pgpass` ให้อัตโนมัติ


---

## 4. แผนผังโฟลเดอร์ของโปรเจค (Directory Structure)

```text
bobill/
├── .env.example              # ไฟล์โครงร่างตัวแปรสภาพแวดล้อม
├── Makefile                  # สคริปต์สั้นสำหรับควบคุม Docker Compose
├── docker-compose.dev.yml    # การกำหนดค่าบริการต่างๆ สำหรับโหมดพัฒนา
├── doc/                      # โฟลเดอร์สำหรับเอกสารอ้างอิงโครงการ
│   └── Into.md               # ไฟล์นี้ (คู่มือสำหรับผู้พัฒนาและ AI)
├── backend/                  # ซอร์สโค้ดของ API Server (Express.js)
│   ├── prisma/               # ข้อมูล Schema และโฟลเดอร์การโยกย้ายข้อมูลฐานข้อมูล
│   │   ├── schema.prisma     # โครงสร้างฐานข้อมูลของ Prisma
│   │   └── migrations/       # ประวัติการ migrate ฐานข้อมูล
│   ├── src/                  # โค้ดโปรแกรมของ backend
│   │   ├── app.ts            # ไฟล์หลักที่เป็นจุดเริ่มต้นระบบของ Express
│   │   ├── config/           # การจัดการข้อมูลแวดล้อม (Environment) และการตั้งค่าระบบ
│   │   ├── generated/        # โฟลเดอร์เก็บ Prisma Client ที่ถูกเจนเนอเรตออกมา
│   │   └── modules/          # ส่วนการแบ่งโมดูลการทำงาน (เช่น auth, users, invoices, employee-cards)
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # ซอร์สโค้ดของเว็บส่วนหน้า (Next.js)
│   ├── app/                  # โครงสร้างเพจและการทำงานแบบ App Router (Next.js)
│   │   ├── layout.tsx        # เลย์เอาต์หลักของแอปพลิเคชัน
│   │   ├── globals.css       # สไตล์รวมของแอป (Tailwind CSS v4)
│   │   ├── invoices/         # เพจจัดการใบแจ้งหนี้
│   │   ├── employee-cards/   # เพจจัดการบัตรพนักงาน
│   │   ├── login/            # เพจลงชื่อเข้าใช้
│   │   └── signup/           # เพจสมัครสมาชิก
│   ├── components/           # ส่วนประกอบ UI ขนาดเล็กที่ใช้ซ้ำได้
│   ├── Dockerfile
│   └── package.json
└── test/                     # โฟลเดอร์สำหรับการทดสอบ
    └── test/                 # โฟลเดอร์หลักที่รวบรวม Bruno API Testing Collection (*.yml)
```

---

## 5. การจัดการฐานข้อมูล (Database Migrations & Prisma)

เมื่อมีการเปลี่ยนแปลงโครงสร้างฐานข้อมูลในไฟล์ `backend/prisma/schema.prisma` จะต้องดำเนินการตามขั้นตอนดังนี้:

1. **สร้างไฟล์ Migration ใหม่** (ทำในเครื่องโฮสต์ผ่าน backend directory หรือเข้าไปรันใน container):
   ```bash
   npx prisma migrate dev --name <migration_name>
   ```
2. **การอัปเดต Prisma Client** (หลังจากรัน migration แล้ว ให้รันคำสั่งนี้เพื่อให้ระบบสร้าง types ของโมเดลใหม่ใน `backend/src/generated/prisma`):
   ```bash
   npx prisma generate
   ```

*(หมายเหตุ: โค้ดของ Prisma Client ถูกระบุปลายทาง (output) ไปยัง `../src/generated/prisma` เพื่อให้แยกส่วนออกจาก `node_modules` ป้องกันปัญหา Type-checking สูญหายระหว่างการติดตั้งบน Docker)*

---

## 6. การตรวจสอบและทดสอบระบบ (Testing & Verification)

โปรเจคนี้จัดเตรียมเครื่องมือ **Bruno Collection** สำหรับการทดสอบ Endpoint ต่างๆ ของ API อยู่ภายใต้โฟลเดอร์ `test/test/`
- ไฟล์หลักสำหรับตั้งค่าคอลเลกชันคือ [opencollection.yml](file:///d:/Code/Job/bobill/test/test/opencollection.yml)
- การทดสอบแบ่งออกเป็น:
  - `GET.yml`: ทดสอบการเรียกดูข้อมูลใบแจ้งหนี้
  - `GET ID.yml`: ทดสอบการดึงข้อมูลใบแจ้งหนี้แบบระบุ ID
  - `POST.yml`: ทดสอบการบันทึก/ส่งข้อมูลใบแจ้งหนี้ใหม่
- **วิธีใช้งาน**: สามารถติดตั้งแอปพลิเคชัน Bruno (API Client) แล้วทำการเปิด (Import) โฟลเดอร์ `test/test` เพื่อทำการสั่งยิง API และตรวจสอบความสมบูรณ์ในการพัฒนาได้ทันที

---

## 7. กฎและคำแนะนำพิเศษสำหรับ AI Agents (Developer Rules & Guidelines)

เมื่อได้รับมอบหมายให้แก้ไขโปรแกรมในโปรเจคนี้ ให้ปฏิบัติตามแนวทางต่อไปนี้:

1. **การใช้ Node.js ESM Import ใน Backend**:
   - ใน `backend` เราใช้โมดูลแบบ ESM (`"type": "module"`)
   - เวลาทำ Import ไฟล์ภายในโปรเจค จะต้องใส่ชื่อสกุลไฟล์ `.js` เสมอ (ตัวอย่าง: `import { authRoutes } from "./modules/auth/auth.routes.js";`) ห้ามเขียนโดยไม่มีนามสกุลเด็ดขาด
2. **การจัดสไตล์ของ Frontend**:
   - เราใช้ **Tailwind CSS v4.x**
   - การปรับแต่งสไตล์ให้ใช้คุณสมบัติของ Tailwind Utility Classes เป็นหลัก และหลีกเลี่ยงการเขียนสไตล์อินไลน์หรือ CSS พิเศษเว้นแต่จำเป็น
   - การประกาศ custom configuration ของธีมใน Tailwind v4 จะทำที่ `@theme inline` ภายใน [globals.css](file:///d:/Code/Job/bobill/frontend/app/globals.css) แทนการใช้ `tailwind.config.js`
3. **การแก้ไขโครงสร้างฐานข้อมูล**:
   - ห้ามลืมสร้าง Migration ไฟล์โดยเด็ดขาดเมื่อทำการเปลี่ยนฟิลด์หรือชื่อตารางใดๆ
   - อ้างอิงโฟลเดอร์ปลายทางของ Prisma Client เสมอตามคอนฟิก `output = "../src/generated/prisma"` ใน `schema.prisma`
4. **ความเข้ากันได้และการเก็บรักษาคำอธิบายโค้ด (Documentation Integrity)**:
   - ห้ามลบคำอธิบาย (comments), เอกสารประกอบ (JSDoc), หรือ metadata ต่างๆ ที่ไม่มีส่วนเกี่ยวข้องกับการแก้ไขโดยเด็ดขาด

---

## 8. ขั้นตอนการทำงานและการรักษาความถูกต้องของเอกสาร (Workflow & Documentation Integrity)

1. **อ่านกฎและเอกสารก่อนเริ่มงาน (Read Guidelines First)**:
   - ทุกครั้งก่อนเริ่มทำงานหรือแก้ไขระบบ AI Agent และผู้พัฒนาต้องอ่านกฎเกณฑ์ที่ระบุใน `.agents/AGENTS.md` และเอกสารคู่มือในโฟลเดอร์ `doc/` (เช่น `doc/Into.md`) ก่อนเสมอ เพื่อทำความเข้าใจสภาพแวดล้อมและมาตรฐานที่กำหนดไว้
2. **อัปเดตเอกสารทันทีหลังจากแก้ไขระบบ (Update Documentation)**:
   - เมื่อทำการแก้ไขหรือเพิ่มระบบงานใดๆ เสร็จสิ้นแล้ว จะต้องอัปเดตเอกสารที่อธิบายระบบนั้นๆ หรือสร้างเอกสาร Walkthrough/คู่มือฉบับใหม่ที่อธิบายการอัปเดตดังกล่าว โดยให้เขียนแก้ไขทดแทนส่วนเก่าในเอกสารโดยตรง เพื่อให้เอกสารและคำอธิบายระบบมีความเป็นปัจจุบันมากที่สุดเสมอ
