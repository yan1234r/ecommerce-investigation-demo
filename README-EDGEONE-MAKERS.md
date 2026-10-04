# EdgeOne Makers 动态 AI 接入

本目录包含 Web 版 `index.html`、手机演示版 `app.html`，以及同源接口 `POST /api/analyze` 和 `POST /api/search`。搜索调用豆包搜索 Custom 版公开网页 API，分析仍由模型完成；密钥只由服务端函数读取。

## Makers 环境变量

在 EdgeOne Makers 项目设置中添加以下三个变量，然后重新部署：

| 变量 | 示例/填写方式 |
|---|---|
| `AI_GATEWAY_BASE_URL` | `https://ark.cn-beijing.volces.com/api/plan/v3`（Agent Plan 的 OpenAI 兼容接口） |
| `AI_GATEWAY_API_KEY` | Agent Plan 专属 API Key，只填入 Makers 控制台，不能放进网页源码或 Git |
| `AI_GATEWAY_MODEL` | `doubao-seed-2-1-turbo-260628`（本账号 Agent Plan Small 当前资源列表中可调用；以套餐实时列表为准） |
| `SEARCH_API_KEY` | 可选：单独用于豆包搜索的 Agent Plan 专属 Key；不填则复用 `AI_GATEWAY_API_KEY` |

`AI_GATEWAY_BASE_URL` 填到 `/api/plan/v3` 这一层即可，函数会补上 `/chat/completions`。如果填入的地址已经以 `/chat/completions` 结尾，函数也可直接使用。

EdgeOne Cloud Functions 运行上限为 30 秒。本项目把上游等待设为 25 秒，并对该型号关闭深度思考，以便在现场演示时尽快返回可核验的结构化草稿。超时会返回明确错误，可重试。

网站运行时应使用与所选网关匹配的专属凭据和套餐内模型。Agent Plan、Coding Plan 与普通方舟 API 的 Base URL、API Key 不可混用；不要仅凭 Key 的外观判断它适用的套餐或接口。

## 部署

1. 将本仓库根目录的内容部署到已经创建的 Makers 项目（或者将这些文件合并到该项目的代码仓库）。确保 `cloud-functions/api/analyze.js` 位于项目根目录下的 `cloud-functions/api/`。
2. 在 Makers 项目环境变量中填写上述变量。此前发到聊天里的 API Key 已暴露，必须先撤销并重新生成，再把新 Key 直接填入 Makers 控制台，不要再发送到聊天。
3. 触发一次新的部署。环境变量变更不会回写到已经完成的旧部署。
4. 在 Agent Plan 控制台 Harness 中确认豆包搜索抵扣开关已开启。打开站点首页，输入店铺名后点击“搜索公开网页”；核对网址并勾选要纳入分析的线索，也可粘贴文字或选择 TXT/MD/CSV/JSON 文件（最多 4 个，单个 100 KB，合计 14000 字符），进入调查后在最后一步点击“生成完整报告”。
5. 检查 Makers 的函数日志和部署日志。接口 GET `/api/analyze` 只返回路由存活状态；POST 请求会真实调用模型并消耗账户额度。

## 当前实现范围

- 输入只在本次页面内存中保留；文件在浏览器本地读取文本，没有接入 OCR，也没有保存到本 Demo 的数据库。
- 用户提交材料后，文字会发送到配置的模型服务。请使用合成或已获授权的材料，并在正式展示前补上符合团队要求的隐私告知。
- 豆包搜索独立检索公开网页，返回标题、摘要和网址。用户勾选后，这些内容以“未经原文核验的网页线索”进入模型分析。它不等于抖店后台数据、工商查档或原始证据。服务端只接受能在本次输入中逐字找到的摘录；未匹配的模型引用会被剔除。
- 固定的七模块和演示报告仍是合成案例参考，与本次材料分析明确分开；报告不作法律意见，不给商家或债权人自动定性。
- 接口限制正文长度、超时和单实例内短时请求频率。单实例限流不能取代 Makers 的项目级额度/安全策略，不适合作为无访问控制的长期公开生产服务。豆包搜索会消耗搜索额度；公开体验前应在 EdgeOne 配置项目级限流和用量告警。
