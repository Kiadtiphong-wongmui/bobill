# 🧾 BoBill - ระบบจัดการใบแจ้งหนี้/ใบเสร็จรับเงิน และบัตรพนักงาน

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.x-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v22-339933?logo=nodedotjs)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.2.1-000000?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)

**BoBill** เป็นเว็บแอปพลิเคชันแบบ Full-stack สำหรับบริหารจัดการเอกสารการเงิน ออกใบแจ้งหนี้/ใบเสร็จรับเงิน (Invoice/Billing Management) และสร้างบัตรประจำตัวพนักงาน (Employee ID Card) พร้อมระบบวิเคราะห์สถิติ สิทธิ์การเข้าใช้งาน (Roles: `ADMIN`, `USER`) การส่งออกไฟล์ PDF ภาษาไทยที่สมบูรณ์แบบ และระบบสำรองข้อมูล (Backup & Restore)

---

## ✨ คุณสมบัติหลัก (Key Features)

### 📄 1. ระบบจัดการใบแจ้งหนี้ / ใบเสร็จรับเงิน (Invoice Management)
- **วงจรเอกสาร (Life-Cycle)**: รองรับสถานะ `DRAFT` (ฉบับร่าง), `ISSUED` (ออกแล้ว), และ `CANCELLED` (ยกเลิก)
- **การคำนวณอัตโนมัติ**: คำนวณราคารายการสินค้า (Quantity × Unit Price), ส่วนลด (Discount Total), Subtotal และ Grand Total แบบเรียลไทม์
- **การจัดการลายเซ็น**: รองรับการอัปโหลดไฟล์รูปภาพลายเซ็นผู้มีอำนาจลงนาม พร้อมพรีวิวในเอกสาร
- **ส่งออก PDF ภาษาไทย**: เรนเดอร์เอกสาร PDF ภาษาไทยด้วย `PDFKit` และเลือกใช้ฟอนต์ภาษาไทยมาตรฐาน (`Sarabun`, `THSarabunNew`, `Fahkwang`) ป้องกันปัญหาตัวอักษรซ้อนทับหรือแสดงผลผิดพลาด
- **ระบบค้นหาและกรอง**: กรองข้อมูลตามสถานะ, ผู้ซื้อ, ผู้ขาย, ช่วงวันที่ และค้นหาคีย์เวิร์ดได้อย่างรวดเร็ว

### 📇 2. ระบบจัดการบัตรพนักงาน (Employee ID Card)
- **ขนาดมาตรฐาน**: ออกแบบมาสำหรับขนาดบัตรมาตรฐาน 7.2 × 10.3 ซม. ทั้งด้านหน้าและด้านหลัง
- **Live Preview & Editor**: ปรับแต่งข้อมูลพนักงาน รูปถ่าย หมายเลขใบอนุญาตทำงาน ชื่อผู้ว่าจ้าง ข้อควรปฏิบัติ และลายเซ็น พร้อมแสดงตัวอย่างบัตรสดทันที
- **ส่งออก PDF**: พิมพ์บัตรพนักงานออกเป็นไฟล์ PDF คุณภาพสูง พร้อมนำไปใช้งาน

### 📊 3. แดชบอร์ดและระบบสถิติ (Dashboard & Analytics)
- **สรุปภาพรวม**: แสดงยอดขายรวม (Total Sales), จำนวนเอกสารแยกตามสถานะ (`ISSUED`, `DRAFT`, `CANCELLED`)
- **กราฟและสถิติรายเดือน/รายปี**: กรองดูสถิติรายได้และปริมาณเอกสารย้อนหลังแยกตามปีปฏิทิน
- **รายการล่าสุด**: แสดงใบเสร็จรับเงินที่ทำรายการล่าสุด 5 รายการเพื่อการเข้าถึงอย่างรวดเร็ว

### 🔐 4. ระบบความปลอดภัยและสิทธิ์ใช้งาน (Authentication & Security)
- **Auth Guard 2 ชั้น**:
  - *Frontend Guard (`middleware.ts`)*: ตรวจสอบ HMAC-SHA256 Session Cookie (`bobill_session`) ป้องกันการเข้าถึงหน้าเว็บโดยไม่ได้รับอนุญาต
  - *Backend Guard (`requireAuth`)*: ตรวจสอบ `Authorization: Bearer <token>` สำหรับทุก API endpoint
- **Role-Based Access Control (RBAC)**: แบ่งสิทธิ์การใช้งานเป็น `USER` และ `ADMIN`

### 💾 5. ระบบสำรองและล้างข้อมูล (Backup, Restore & Clean Data)
- **Admin Only Utility**: ผู้ใช้ระดับ `ADMIN` สามารถ Export ข้อมูลทุกตารางในระบบเป็น JSON
- **Restore & Clean Data**: รองรับการ Import นำเข้าข้อมูลกลับคืนสู่ระบบ และมีคำสั่งล้างข้อมูลทดสอบได้อย่างปลอดภัย

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

| ส่วนงาน | เทคโนโลยีที่เลือกใช้ | รายละเอียด |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js v16.2.4** (React 19) | App Router, Server/Client Components, Next.js Middleware Guard |
| **Styling** | **Tailwind CSS v4.x** | Configured via `@theme inline`ใน `globals.css` |
| **Backend Framework** | **Node.js v22 + Express v5.2.1** | Native ESM (`"type": "module"`), TypeScript |
| **Database & ORM** | **PostgreSQL 16 + Prisma ORM 7.8.0** | Custom output client (`backend/src/generated/prisma`) |
| **PDF Rendering** | **PDFKit v0.18.0** | Registered Thai Fonts: `Sarabun`, `THSarabunNew`, `Fahkwang` |
| **Storage & Upload** | **Multer** | Local storage inside `backend/src/upload/` |
| **Dev Tooling** | **Docker Compose, Makefile, Bruno** | Zero-config pgAdmin 4 integration & ngrok Tunnel Support |

---

## 📂 โครงสร้างโปรเจค (Project Structure)

```text
bobill/
├── .env.example              # ไฟล์แม่แบบ Environment Variables
├── Makefile                  # คำสั่งลัดควบคุม Docker Container
├── docker-compose.dev.yml    # การตั้งค่า Docker Services (Postgres, Backend, Frontend, pgAdmin, Ngrok)
├── servers.json / pgpass     # ไฟล์ Auto-config สำหรับ pgAdmin 4
├── doc/                      # เอกสารสถาปัตยกรรมและคู่มือระบบ
│   ├── Into.md               # คู่มือสำหรับนักพัฒนาและเอเจนต์ AI
│   └── system_architecture.md # รายละเอียดสถาปัตยกรรม, API Endpoints, Database Schemas
├── backend/                  # RESTful API Server (Express.js + Prisma)
│   ├── prisma/               # Prisma Schema (schema.prisma) & SQL Migrations
│   ├── src/
│   │   ├── app.ts            # Entrypoint หลักของ Express
│   │   ├── config/           # Prisma client and environment settings
│   │   ├── generated/        # Prisma generated TypeScript types
│   │   ├── modules/          # Core modules: auth, users, invoices, employee-cards, backup, uploads
│   │   └── upload/           # Storage directory สำหรับรูปภาพและลายเซ็น
│   └── package.json
├── frontend/                 # Web Interface (Next.js App Router)
│   ├── middleware.ts         # Route guard validation
│   ├── app/                  # Application pages (/invoices, /employee-cards, /backup, /login, /signup)
│   │   └── api/              # Proxy API routes ต่อตรงเข้า Backend
│   ├── components/           # UI Components (invoices, layout, ui, dashboard, auth)
│   ├── lib/                  # Backend Proxy Helper (`backend-proxy.ts`), API Clients & Formatters
│   └── package.json
└── test/                     # Bruno API Collection สำหรับทดสอบ API
```

---

## 🚀 การติดตั้งและเริ่มใช้งาน (Quick Start)

### สิ่งที่ต้องมีในเครื่อง (Prerequisites)
- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js v22+](https://nodejs.org/) (กรณีต้องการรันคำสั่ง Prisma หรือ Script บนเครื่องโฮสต์)
- `make` (ตัวเลือกเพิ่มเติมสำหรับใช้คำสั่งลัด)

---

### 1. ตั้งค่า Environment Variables
คัดลอกไฟล์ `.env.example` เป็น `.env`:
```bash
cp .env.example .env
```
กำหนดค่ารหัสผ่านและ Secret ใน `.env` เช่น:
```env
POSTGRES_DB=bobill
POSTGRES_USER=bobill_user
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://bobill_user:your_secure_password@localhost:5432/bobill?schema=public
AUTH_SECRET=your_long_random_session_secret_key
```

---

### 2. เริ่มต้นรันระบบด้วย Docker (Makefile)

สั่งรันระบบทั้งหมด (Database, Backend, Frontend, pgAdmin) ผ่าน **Makefile**:

```bash
# เริ่มรันระบบในโหมด Development
make dev
```

เมื่อสั่งรันสำเร็จ สามารถเข้าใช้งานบริการต่างๆ ได้ดังนี้:

| บริการ | URL / Port | หมายเหตุ |
| :--- | :--- | :--- |
| 🌐 **Frontend (Next.js)** | [http://localhost:3000](http://localhost:3000) | หน้าเว็บหลักสำหรับใช้งาน |
| ⚙️ **Backend API (Express)** | [http://localhost:3001](http://localhost:3001) | RESTful API Endpoints |
| 🐘 **pgAdmin 4** | [http://localhost:5050](http://localhost:5050) | ล็อกอินให้อัตโนมัติ (Desktop Mode) ไม่ต้องใส่รหัสผ่าน |
| 🛢️ **PostgreSQL** | `localhost:5432` | ฐานข้อมูลหลัก |

---

### คำสั่งอื่นๆ ใน Makefile

```bash
# หยุดการทำงานของ Container ทั้งหมด
make dev-stop

# รันระบบพร้อมเปิด ngrok tunnel สำหรับทดสอบลิงก์ภายนอก
make dev-ngrok

# หยุดการทำงานรวมถึง ngrok tunnel
make dev-ngrok-stop

# ล้าง Container, Network, Volume และ Image เพื่อเริ่มใหม่แบบสะอาด (Clean Build)
make dev-clean
```

---

## 🛢️ การจัดการฐานข้อมูล (Database Management & Migrations)

เมื่อมีการปรับเปลี่ยนโครงสร้างตารางใน `backend/prisma/schema.prisma` สามารถทำ Migration ได้ดังนี้:

1. **สร้างไฟล์ Migration ใหม่**:
   ```bash
   cd backend
   npx prisma migrate dev --name <migration_name>
   ```
2. **สร้าง TypeScript Types สำหรับ Prisma Client**:
   ```bash
   npx prisma generate
   ```

*(หมายเหตุ: Prisma Client ถูกตั้งค่าให้ออกไฟล์ไปที่ `backend/src/generated/prisma` เพื่อแยกออกจาก `node_modules` ช่วยลดปัญหาเกี่ยวกับ Docker Sync)*

---

## 🧪 การทดสอบ API (API Testing with Bruno)

โปรเจคนี้จัดเตรียมชุดทดสอบ API แบบ Integration Test โดยใช้ [Bruno API Client](https://www.usebruno.com/):
- **โฟลเดอร์ทดสอบ**: `test/test/`
- **ไฟล์คอนฟิกหลัก**: [`opencollection.yml`](file:///d:/Work/Code/Job/bobill/test/test/opencollection.yml)
- **วิธีการใช้งาน**:
  1. เปิดโปรแกรม Bruno
  2. เลือก **Open Collection** แล้วเลือกไปที่โฟลเดอร์ `test/test`
  3. สามารถทดสอบยิง API (Auth, Invoices GET/POST, Users ฯลฯ) ได้ทันที

---

## 📖 เอกสารอ้างอิงเพิ่มเติม (Documentation)

สำหรับรายละเอียดเชิงลึกเกี่ยวกับการทำงาน สถาปัตยกรรม และมาตรฐานการพัฒนา สามารถอ่านเพิ่มเติมได้ที่:
- 📑 [Developer & AI Agent Guide (`doc/Into.md`)](file:///d:/Work/Code/Job/bobill/doc/Into.md) - กฎและข้อระวังในการพัฒนาสำหรับผู้พัฒนาและ AI
- 🏗️ [System Architecture Specifications (`doc/system_architecture.md`)](file:///d:/Work/Code/Job/bobill/doc/system_architecture.md) - รายละเอียดแผนผัง API Routes, Database Schemas และ Auth Workflows

---

## 📝 กฎการพัฒนาที่สำคัญ (Developer Rules)

1. **Backend Import (.js Extension)**: Backend ใช้ ESM (`"type": "module"`) เมื่อสั่ง Import ไฟล์ภายในโครงการ ต้องระบุ `.js` ลงท้ายเสมอ (เช่น `import { authRoutes } from "./modules/auth/auth.routes.js";`)
2. **Frontend Styling**: ใช้ **Tailwind CSS v4** ผ่าน Utility Classes ปรับแต่ง Custom Theme ใน `globals.css` ภายใต้ `@theme inline`
3. **TypeScript Strictly Typed**: รัน `npx tsc --noEmit` ทั้งใน `frontend/` และ `backend/` ห้ามมี TypeScript Error
4. **Documentation Sync**: หากมีการแก้ไข API Endpoint หรือ Schema ต้องทำการอัปเดต [doc/system_architecture.md](file:///d:/Work/Code/Job/bobill/doc/system_architecture.md) ควบคู่กันเสมอ

---

<p center="align">
  <i>Developed for BoBill Invoice & Employee Card Management System</i>
</p>
