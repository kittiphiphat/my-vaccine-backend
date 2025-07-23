# Strapi + Next.js Setup & Permission Guide

---

## 1. เตรียมเครื่องมือก่อนติดตั้ง

- **Node.js**: เวอร์ชันแนะนำ v18 หรือ v20  
- **Package Manager**:  
  - npm (v6 ขึ้นไป)  
  - หรือ yarn  
- **Python**: ต้องติดตั้งถ้าใช้ฐานข้อมูล SQLite

---

## 2. สร้างโปรเจกต์ Strapi (v4.25.19)

```bash
npx create-strapi-app@4.25.19 my-strapi-project --quickstart
หลังจากรันคำสั่งนี้ จะมีขั้นตอนดังนี้:

Terminal จะให้เลือก Login/Sign up เพื่อสมัครบัญชี Strapi Cloud

เปิด Browser ให้ยืนยันโค้ดใน Terminal

กด "Continue with GitHub"

เมื่อล็อกอินเสร็จ จะขึ้นข้อความ "Congratulations, you're all set!"

ปิดหน้า Browser และกลับมา Terminal ได้เลย

ดูภาพประกอบ:
https://docs-v4.strapi.io/dev-docs/quick-start

3. ติดตั้ง Cloudinary Provider (เก็บโลโก้ รูปภาพ)

bash
npm install @strapi/provider-upload-cloudinary

จากนั้นเพิ่มไฟล์ .env ของ Strapi:
env
CLOUDINARY_NAME=dksk7exum
CLOUDINARY_KEY=673435934737378
CLOUDINARY_SECRET=O_jUrKMg-Qf7Z5zYQ9U-2woVLBA
(ใช้ Cloudinary ที่ให้ไว้ได้เลย)

4. ตั้งค่า .env.local สำหรับ Next.js
env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_SOCKET_IO_URL=http://localhost:4000



5. การตั้งค่าสิทธิ์ (Permissions) ใน Strapi Admin
5.1 Public Role (ไม่ล็อกอินก็เข้าถึงได้)
Collection	สิทธิ์ที่เปิด
Auth	login, logout
booking-setting	create, delete, find, findOne, update
hospitel	create, find, findOne
patient	create, delete, find, findOne, update
vaccine	create, find, findOne
vaccine-booking	create, delete, find, findOne, update
vaccine-service-day	create, delete, find, findOne, update
vaccine-time-slot	create, delete, find, findOne, update
User-permissions - role	find, findOne, create
User-permissions - user	create, find, findOne, update, destroy, me

5.2 Admin Role
Collection	สิทธิ์ที่เปิด
Auth	login, logout
booking-setting	create, delete, find, findOne, update
healthz	index
hospitel	create, find, findOne, update
patient	create, delete, find, findOne, update
vaccine	create, delete, find, findOne, update
vaccine-booking	create, delete, find, findOne, update
vaccine-service-day	create, delete, find, findOne, update
vaccine-time-slot	create, delete, find, findOne, update
User-permissions - role	find, findOne, create
User-permissions - user	find, findOne, me
    
5.3 User Role (ล็อกอินทั่วไป)
Collection	สิทธิ์ที่เปิด
Auth	login, logout
booking-setting	find, findOne
hospitel	find, findOne
patient	create, find, findOne
vaccine	create, delete, find, findOne, update
vaccine-booking	create, delete, find, findOne, update
vaccine-service-day	find, findOne
vaccine-time-slot	find, findOne
User-permissions - role	find, findOne, create
User-permissions - user	find, findOne, me