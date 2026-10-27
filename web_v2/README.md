# BabyLog Web

BabyLog 3.1 前端，使用 React 19、Vite、HeroUI 和 Tailwind CSS 构建，支持响应式布局、暗黑模式和 PWA。

## 开发

```bash
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:3000`，通过 Vite 代理访问后端 `http://localhost:8888`。

## 构建

```bash
npm run build
```

构建产物输出到 `dist/`。项目根目录也可以直接运行：

```bash
npm run build
node start.js
```

生产环境由根目录的 `start.js` 托管 `web_v2/dist`。
