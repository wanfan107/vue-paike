// 预加载脚本：在 Vite 之前 bootstrap global-agent
// .cjs 后缀 = CommonJS，避开项目 "type": "module" 的 ESM 解析
// 默认走本机 v2rayN mixed:10808，也可通过环境变量覆盖：
//   GLOBAL_AGENT_HTTP_PROXY=http://127.0.0.1:10808
//   GLOBAL_AGENT_HTTPS_PROXY=http://127.0.0.1:10808
const DEFAULT_PROXY = "http://127.0.0.1:10808";
process.env.GLOBAL_AGENT_HTTP_PROXY = process.env.GLOBAL_AGENT_HTTP_PROXY || DEFAULT_PROXY;
process.env.GLOBAL_AGENT_HTTPS_PROXY = process.env.GLOBAL_AGENT_HTTPS_PROXY || DEFAULT_PROXY;

try {
  const { bootstrap } = require("global-agent");
  bootstrap({ environmentVariableNamespace: "GLOBAL_AGENT_" });
  console.log("[agent] bootstrap OK -> HTTP_PROXY:", process.env.GLOBAL_AGENT_HTTP_PROXY);
} catch (e) {
  console.log("[agent] skip:", e.message);
}
