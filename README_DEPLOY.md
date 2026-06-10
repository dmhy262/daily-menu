# 每周菜谱生成器 - 部署指南

## 在本地测试

### 1. 构建项目
```bash
npm install
npm run build
```

### 2. 启动服务器
```bash
npm start
```

### 3. 访问应用
打开浏览器访问 http://localhost:3001

---

## 在群辉NAS部署（Docker方式）

### 方法一：使用 Docker（推荐）

1. **创建 Dockerfile**

在项目根目录创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["node", "server.js"]
```

2. **创建 .dockerignore**

```
node_modules
build
.git
.gitignore
.DS_Store
data.json
```

3. **上传到群辉并构建**

在群辉 Docker 终端中运行：

```bash
# 进入项目目录
cd /volume1/docker/weekly-menu

# 构建镜像
docker build -t weekly-menu .

# 运行容器
docker run -d \
  --name weekly-menu \
  -p 3001:3001 \
  -v /volume1/docker/weekly-menu/data:/app/data \
  --restart always \
  weekly-menu
```

---

### 方法二：使用 Node.js 直接运行

1. **在群辉上安装 Node.js**

在群辉套件中心安装 Node.js 18 或更高版本

2. **上传文件**

把整个项目上传到群辉的共享文件夹

3. **安装依赖并运行**

在群辉 SSH 或任务计划中运行：

```bash
cd /path/to/your/project
npm install --production
npm run build
npm start
```

4. **设置自动启动**

在群辉"任务计划"中创建开机启动任务

---

## 数据持久化

数据会自动保存在 `data.json` 文件中，记得定期备份这个文件！

---

## 访问应用

部署完成后，通过以下地址访问：
http://你的群辉IP:3001
