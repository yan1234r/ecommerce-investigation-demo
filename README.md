# 电商真实经营调查 Agent

面向债权人、平台审查和尽调用户的黑客松 Demo：拆解商家经营信号，以「结论—依据—缺口—下一步」整理用户提交的材料，输出可追溯的风险提示草稿。

## 功能

- Web 与手机演示页面，七个模块展示调查流程。
- 手动录入文字，或上传 TXT、MD、CSV、JSON 文件（最多 4 个，合计 14000 字符）。
- 服务端通过 OpenAI Chat Completions 兼容接口生成分析草稿。
- 逐字检查模型引用是否存在于输入材料中，不匹配的引用会被剔除。
- 内置案例与固定流程为合成演示，不代表真实企业结论；模型输出只依据提交文字，未核验原件。

## 源码结构

```text
index.html                       Web Demo
app.html                         手机端 Demo
cloud-functions/api/analyze.js   EdgeOne Makers AI 接口
README-EDGEONE-MAKERS.md          部署及环境变量说明
RUNNING.md                       本地运行和验收步骤
.env.example                    环境变量填写示例（无密钥）
```

## 快速运行

需要 Python 3。在仓库根目录执行：

```sh
python3 -m http.server 8080
```

- Web：http://localhost:8080/
- 手机端：http://localhost:8080/app.html

此方式用于预览页面与合成流程，Python 静态服务器不执行云函数；真实 AI 分析请按下文部署到 EdgeOne Makers。

## 运行真实 AI

1. 在 EdgeOne Makers 导入本仓库，或上传仓库根目录内的文件。无需前端构建命令。
2. 确保 `cloud-functions/api/analyze.js` 位于部署根目录下，使 Makers 识别 `/api/analyze`。
3. 在项目的服务端环境变量里设置 `AI_GATEWAY_BASE_URL`、`AI_GATEWAY_MODEL` 和 `AI_GATEWAY_API_KEY`，参考 `.env.example`。必须使用账号实际可调用的模型和与网关匹配的凭据。
4. 重新部署使变量生效。输入店铺名和材料，进入调查流程后点击「生成完整报告」。
5. 检查报告是否显示本次材料的 AI 分析与原文依据。固定合成案例不能视为模型调用成功的证明。

详见 [运行说明](RUNNING.md) 和 [EdgeOne 部署说明](README-EDGEONE-MAKERS.md)。

## 当前状态与限制

- 前端和云函数已经在 Makers 完成部署；最近一次真实模型调用返回上游 401，鉴权尚未通过，不能宣称 AI 已稳定运行。
- `/api/analyze` 的 GET 返回只证明路由存活，不证明模型密钥、模型权限或额度可用。
- 无数据库、登录、OCR、联网查档；页面刷新后输入不持久保存。提交文字会传给配置的模型供应商，其数据处理政策需另行核对。
- 限流仅在单实例内生效。长期公开运行仍需平台级限流、预算控制与运行监控。
- Makers 临时预览链接有时限；长期展示需绑定可持续访问的域名。
- 不上传 API Key、账号配置、真实调查原件或个人敏感信息。请用合成或获授权材料演示。
- 输出不构成法律意见，也不能直接认定失信、欺诈或资产转移。

## 技术栈

原生 HTML/CSS/JavaScript；EdgeOne Makers Cloud Functions；OpenAI Chat Completions 兼容模型服务。无需前端 npm 依赖。
