# Strapi + Next.js Setup & Permission Guide


## 1. เตรียมเครื่องมือก่อนติดตั้ง

- **Node.js**: เวอร์ชันแนะนำ v18 หรือ v20  
- **Package Manager**:  
  - npm (v6 ขึ้นไป)  
  - หรือ yarn  
- **Python**: ต้องติดตั้งถ้าใช้ฐานข้อมูล SQLite


## 2. สร้างโปรเจกต์ Strapi (v4.25.19) ใหม่ 

```bash
npx create-strapi-app@4.25.19 my-strapi-project --quickstart


ดูภาพประกอบ:
https://docs-v4.strapi.io/dev-docs/quick-start

หลังติดตั้งเสร็จ 
Settings -> Users & Permissions plugin-> Roles -> add new role 
-Admin
-Patient
Settings -> advanced-settings -> Default role for authenticated users ->Patient


config/database.js แก้ไขสำหรับเชื่อมฐานข้อมูล

module.exports = ({ env }) => ({
  connection: {
    client: 'mysql2',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 3306),
      database: env('DATABASE_NAME', 'hospital_vaccine_db'),
      user: env('DATABASE_USERNAME', 'hospital_admin'),
      password: env('DATABASE_PASSWORD', '0MedxCmU'),
    },
  },
});




4. ตั้งค่า .env.local สำหรับ Next.js
env 
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_SOCKET_IO_URL=http://localhost:4000



ตัวอย่าง env -backend
HOST=0.0.0.0
PORT=1337
APP_KEYS=0u10gYbAfJuf+y6TXHlPwg==,zqkC+fkN/iLWtquhcMe0aw==,Gkp1pKufarVqf3fJQRLQgQ==,FI/82N/UU7c2qy+6B7KXLg==
API_TOKEN_SALT=MityhsJObHaHqSeuAzKcqg==
ADMIN_JWT_SECRET=6jDIm04zw38X+y2dCOijXw==
TRANSFER_TOKEN_SALT=vSHFtTXqYG2mGC1Pcutlcg==
JWT_SECRET=olE5M1PMrgQ4mEqRRLZYsQ==
# Database
DATABASE_CLIENT=mysql
DATABASE_HOST=mysql
DATABASE_PORT=3306
DATABASE_NAME=hospital_vaccine_db
DATABASE_USERNAME=hospital_admin
DATABASE_PASSWORD=0MedxCmU
DATABASE_SSL=false
DATABASE_TIMEZONE=Asia/Bangkok
SOCKET_IO_PORT=4000
NODE_ENV=development


วิธีสร้าง database (ตัวอย่าง MySQL/MariaDB): สำหรับ localhost

เข้าเช็กใน MySQL Container ว่ามี user นี้จริงไหม

รันคำสั่งนี้ใน Terminal: docker exec -it mysql_hospital mysql -u root -p

เมื่อถามรหัส ให้ใส่:รหัสของ ROOT

จากนั้นใน MySQL shell ให้รันคำสั่ง: SELECT user, host FROM mysql.user;

ดูว่ามี admin_hospital หรือไม่

ถ้า ไม่มี ให้สร้างด้วยคำสั่งนี้:
CREATE USER 'admin_hospital'@'%' IDENTIFIED BY 'MedxCmU0';
GRANT ALL PRIVILEGES ON hospital_vaccine.* TO 'admin_hospital'@'%';
FLUSH PRIVILEGES;



สร้าง network ด้วยคำสั่ง

docker network create app-network

ตรวจสอบ network
docker network ls

MySQL compose:
networks:
  app-network:
    external: true


Backend compose:
networks:
  app-network:
    external: true



5. การตั้งค่าสิทธิ์ (Permissions) ใน Strapi Admin

5.2 Admin Role
Collection	สิทธิ์ที่เปิด
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
booking-setting	find, findOne
hospitel	find, findOne
patient	create, find, findOne
vaccine	create, find, findOne, update
vaccine-booking	create, find, findOne, update, delete
vaccine-service-day	find, findOne
vaccine-time-slot	find, findOne
User-permissions - role	find, findOne
User-permissions - user	find, findOne, me
