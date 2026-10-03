# EdgeOne Makers 动态 AI 接入

本目录包含 Web 版 `index.html`、手机演示版 `app.html` 和同源接口 `cloud-functions/api/analyze.js`。部署到支持 Cloud Functions 的 EdgeOne Makers 项目后，前端通过 `POST /api/analyze` 调用模型，模型密钥只由服务端函数读取。

## Makers 环境变量

在 EdgeOne Makers 项目设置中添加以下三个变量，然后重新部署：

| 变量 | 示例/填写方式 |
|---|---|
| `AI_GATEWAY_BASE_URL` | `https://ark.cn-beijing.volces.com/api/v3`（火山方舟标准模型 API） |
| `AI_GATEWAY_API_KEY` | 方舟控制台创建的普通应用 API Key，只填入 Makers 控制台，不能放进网页源码或 Git |
| `AI_GATEWAY_MODEL` | `doubao-seed-2-1-pro-260628`（填写你账号可调用的模型 ID） |

`AI_GATEWAY_BASE_URL` 填到 `/api/v3` 这一层即可，函数会补上 `/chat/completions`。如果填入的地址已经以 `/chat/completions` 结尾，函数也可直接使用。

网站运行时应使用与所选网关匹配的应用 API 凭据和模型权限。Coding Plan 的编程工具配置与网站后端配置应分别管理；不要仅凭 Key 的外观判断它适用的套餐或接口。

## 部署

1. 将 `static-deploy/` 的内容部署到已经创建的 Makers 项目（或者将这些文件合并到该项目的代码仓库）。确保 `cloud-functions/api/analyze.js` 位于项目根目录下的 `cloud-functions/api/`。
2. 在 Makers 项目环境变量中填写上述变量。此前发到聊天里的 API Key 已暴露，必须先撤销并重新生成，再把新 Key 直接填入 Makers 控制台，不要再发送到聊天。
3. 触发一次新的部署。环境变量变更不会回写到已经完成的旧部署。
4. 打开站点首页，输入店铺名，粘贴文字或选择 TXT/MD/CSV/JSON 文件（最多 4 个，单个 100 KB，合计 14000 字符），进入调查后在最后一步点击“生成完整报告”。
5. 检查 Makers 的函数日志和部署日志。接口 GET `/api/analyze` 只返回路由存活状态；POST 请求会真实调用模型并消耗账户额度。

## 当前实现范围

- 输入只在本次页面内存中保留；文件在浏览器本地读取文本，没有接入 OCR，也没有保存到本 Demo 的数据库。
- 用户提交材料后，文字会发送到配置的模型服务。请使用合成或已获授权的材料，并在正式展示前补上符合团队要求的隐私告知。
- 模型仅根据输入文字整理结论、原文依据、缺口和下一步材料，不联网查档、不验证原件。服务端只接受能在原输入中逐字找到的证据摘录；未匹配的模型引用会被剔除。
- 固定的七模块和演示报告仍是合成案例参考，与本次材料分析明确分开；报告不作法律意见，不给商家或债权人自动定性。
- 接口限制正文长度、超时和单实例内短时请求频率。单实例限流不能取代 Makers 的项目级额度/安全策略，不适合作为无访问控制的长期公开生产服务。
