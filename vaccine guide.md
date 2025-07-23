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


ดูภาพประกอบ:
https://docs-v4.strapi.io/dev-docs/quick-start

หลังติดตั้งเสร็จ 
Settings -> Users & Permissions plugin-> Roles -> add new role 
-Admin
-Patient
Settings -> advanced-settings -> Default role for authenticated users ->Patient
  

4. ตั้งค่า .env.local สำหรับ Next.js
env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_SOCKET_IO_URL=http://localhost:4000





5. การตั้งค่าสิทธิ์ (Permissions) ใน Strapi Admin
5.1 Public Role (ไม่ล็อกอินก็เข้าถึงได้)
Collection	สิทธิ์ที่เปิด
Auth	login, logout
User  me

5.2 Admin Role
Collection	สิทธิ์ที่เปิด
Auth	login, logout
booking-setting	create, delete, find, findOne, update  delete
healthz	index
hospitel	create, find, findOne, update
admin-logs create, delete, find, findOne, update  delete
patient-logs  create, delete, find, findOne, update  delete
patient	create, delete, find, findOne, update delete
vaccine	create, delete, find, findOne, update delete
vaccine-booking	find, findOne
vaccine-service-day	create, find, findOne, update, delete
vaccine-time-slot	create, find, findOne, update, delete
User-permissions - role	find, findOne
User-permissions - user	find, findOne, update,destroy, me
    
5.3 Patient (ล็อกอินทั่วไป)
Collection	สิทธิ์ที่เปิด
Auth	login, logout
booking-setting	find, findOne
hospitel	find, findOne
patient	create, find, findOne
vaccine	create, find, findOne, update
vaccine-booking	create, find, findOne, update, delete
vaccine-service-day	find, findOne
vaccine-time-slot	find, findOne
User-permissions - role	find, findOne
User-permissions - user	find, findOne, me