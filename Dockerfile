FROM node:18-bullseye

# ติดตั้ง dependencies ที่จำเป็นสำหรับ build native modules เช่น sharp
RUN apt-get update && apt-get install -y \
  build-essential \
  python3 \
  make \
  g++ \
  git \
  libvips-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/app

# copy package files แล้วติดตั้งก่อน (แยก layer)
COPY package.json package-lock.json ./
RUN npm install

# copy source ทั้งหมด
COPY . .

EXPOSE 1337

CMD ["npm", "run", "develop"]
