/* =====================================================================
   StockScope · 美股终端  (集成朋友 zhangzhanhang855/friendtest 的 JR Stock Terminal)
   - 美股行情池 (ticker / name / sector / basePrice / trend / volatility)
   - 真实行情：经后端代理 /api/quotes (腾讯 gtimg 美股实时价)，拉不到则回退本地合成
   - 蒙特卡洛 AI 预测引擎 (95% 置信带 / 目标价位 / 方向 / 置信度)
   - 绿涨红跌 (美股惯例)
   ===================================================================== */

/* ============ 美股行情池（来自朋友的 JR Stock Terminal） ============ */
const US_STOCKS = [
  { ticker:"SPCX",   name:"SpaceX (Space Exploration)", sector:"Aerospace & Satellites", group:"Aerospace & Satellites", basePrice:140.50, trend:0.58, volatility:3.8 },
  { ticker:"NVDA",   name:"NVIDIA Corp.",              sector:"Semiconductors",          group:"Semiconductors",          basePrice:142.50, trend:0.55, volatility:2.4 },
  { ticker:"AAPL",   name:"Apple Inc.",                sector:"Consumer Tech",           group:"Consumer Tech",           basePrice:232.10, trend:0.20, volatility:1.3 },
  { ticker:"MSFT",   name:"Microsoft Corp.",           sector:"Software & Cloud",        group:"Software & Cloud",        basePrice:428.80, trend:0.30, volatility:1.5 },
  { ticker:"GOOGL",  name:"Alphabet Inc.",             sector:"Internet Services",       group:"AI & Big Data",           basePrice:178.40, trend:0.25, volatility:1.6 },
  { ticker:"AMZN",   name:"Amazon.com Inc.",           sector:"E-Commerce & Cloud",      group:"AI & Big Data",           basePrice:194.20, trend:0.35, volatility:1.8 },
  { ticker:"META",   name:"Meta Platforms Inc.",       sector:"Social Media",            group:"AI & Big Data",           basePrice:588.60, trend:0.45, volatility:2.1 },
  { ticker:"TSLA",   name:"Tesla Inc.",                sector:"Automotive & Clean Energy",group:"Consumer Tech",          basePrice:336.87, trend:0.60, volatility:4.5 },
  { ticker:"PLTR",   name:"Palantir Technologies",     sector:"AI & Big Data",           group:"AI & Big Data",           basePrice:43.80,  trend:0.65, volatility:4.2 },
  { ticker:"AVGO",   name:"Broadcom Inc.",             sector:"Semiconductors",          group:"Semiconductors",          basePrice:175.80, trend:0.40, volatility:2.0 },
  { ticker:"AMD",    name:"Advanced Micro Devices",    sector:"Semiconductors",          group:"Semiconductors",          basePrice:156.40, trend:0.35, volatility:2.8 },
  { ticker:"QCOM",   name:"Qualcomm Inc.",             sector:"Semiconductors",          group:"Semiconductors",          basePrice:168.20, trend:0.20, volatility:1.9 },
  { ticker:"ASML",   name:"ASML Holding NV",           sector:"Semiconductor Equip.",    group:"Semiconductors",          basePrice:710.20, trend:0.25, volatility:2.6 },
  { ticker:"TSM",    name:"Taiwan Semiconductor",      sector:"Semiconductors",          group:"Semiconductors",          basePrice:198.50, trend:0.45, volatility:2.2 },
  { ticker:"INTC",   name:"Intel Corp.",               sector:"Semiconductors",          group:"Semiconductors",          basePrice:22.80,  trend:-0.10,volatility:2.2 },
  { ticker:"TXN",    name:"Texas Instruments",         sector:"Semiconductors",          group:"Semiconductors",          basePrice:204.50, trend:0.15, volatility:1.4 },
  { ticker:"MU",     name:"Micron Technology",         sector:"Memory & Storage",        group:"Semiconductors",          basePrice:108.40, trend:0.30, volatility:2.7 },
  { ticker:"ARM",    name:"Arm Holdings plc",          sector:"Semiconductor IP",        group:"Semiconductors",          basePrice:145.00, trend:0.50, volatility:3.8 },
  { ticker:"AMAT",   name:"Applied Materials",         sector:"Semiconductor Equip.",    group:"Semiconductors",          basePrice:215.30, trend:0.30, volatility:2.1 },
  { ticker:"RKLB",   name:"Rocket Lab USA",            sector:"Aerospace & Launch",      group:"Aerospace & Satellites",  basePrice:10.40,  trend:0.35, volatility:4.2 },
  { ticker:"ASTS",   name:"AST SpaceMobile",           sector:"Satellite Cellular",      group:"Aerospace & Satellites",  basePrice:28.60,  trend:0.48, volatility:5.1 },
  { ticker:"GE",     name:"GE Aerospace",              sector:"Aerospace Propulsion",    group:"Aerospace & Satellites",  basePrice:188.60, trend:0.40, volatility:1.7 },
  { ticker:"CRM",    name:"Salesforce Inc.",           sector:"Enterprise Software",     group:"Software & Cloud",        basePrice:290.40, trend:0.22, volatility:1.7 },
  { ticker:"ORCL",   name:"Oracle Corp.",              sector:"Enterprise Cloud",        group:"Software & Cloud",        basePrice:176.50, trend:0.35, volatility:1.8 },
  { ticker:"ADBE",   name:"Adobe Inc.",                sector:"Creative Software",       group:"Software & Cloud",        basePrice:504.10, trend:0.15, volatility:2.0 },
  { ticker:"NOW",    name:"ServiceNow Inc.",           sector:"Enterprise Software",     group:"Software & Cloud",        basePrice:940.20, trend:0.38, volatility:1.9 },
  { ticker:"INTU",   name:"Intuit Inc.",               sector:"Financial Software",      group:"Software & Cloud",        basePrice:652.30, trend:0.25, volatility:1.6 },
  { ticker:"JPM",    name:"JPMorgan Chase",            sector:"Banking",                 group:"Banking",                 basePrice:222.80, trend:0.25, volatility:1.4 },
  { ticker:"BAC",    name:"Bank of America",          sector:"Banking",                 group:"Banking",                 basePrice:42.60,  trend:0.18, volatility:1.5 },
  { ticker:"WFC",    name:"Wells Fargo",               sector:"Banking",                 group:"Banking",                 basePrice:62.40,  trend:0.20, volatility:1.6 },
  { ticker:"GS",     name:"Goldman Sachs",             sector:"Investment Banking",      group:"Banking",                 basePrice:518.20, trend:0.28, volatility:1.6 },
  { ticker:"MS",     name:"Morgan Stanley",            sector:"Wealth & Investment",     group:"Banking",                 basePrice:114.50, trend:0.24, volatility:1.5 },
  { ticker:"BLK",    name:"BlackRock Inc.",            sector:"Asset Management",        group:"Banking",                 basePrice:980.00, trend:0.20, volatility:1.3 },
  { ticker:"V",      name:"Visa Inc.",                 sector:"Payment Networks",        group:"Banking",                 basePrice:284.10, trend:0.18, volatility:1.1 },
  { ticker:"MA",     name:"Mastercard Inc.",           sector:"Payment Networks",        group:"Banking",                 basePrice:498.30, trend:0.20, volatility:1.2 },
  { ticker:"AXP",    name:"American Express",          sector:"Consumer Credit",         group:"Banking",                 basePrice:272.50, trend:0.26, volatility:1.5 },
  { ticker:"PYPL",   name:"PayPal Holdings",           sector:"Fintech",                 group:"Banking",                 basePrice:81.20,  trend:0.20, volatility:2.4 },
  { ticker:"SCHW",   name:"Charles Schwab",            sector:"Brokerage",               group:"Banking",                 basePrice:72.80,  trend:0.15, volatility:1.8 },
  { ticker:"SPGI",   name:"S&P Global",               sector:"Financial Data",          group:"Banking",                 basePrice:512.40, trend:0.22, volatility:1.2 },
  { ticker:"LLY",    name:"Eli Lilly",                 sector:"Pharmaceuticals",         group:"Pharmaceuticals",         basePrice:915.20, trend:0.50, volatility:2.2 },
  { ticker:"NVO",    name:"Novo Nordisk",              sector:"Pharmaceuticals",         group:"Pharmaceuticals",         basePrice:120.40, trend:0.35, volatility:2.0 },
  { ticker:"JNJ",    name:"Johnson & Johnson",         sector:"Healthcare",              group:"Pharmaceuticals",         basePrice:161.80, trend:0.08, volatility:0.9 },
  { ticker:"UNH",    name:"UnitedHealth Group",        sector:"Managed Healthcare",      group:"Pharmaceuticals",         basePrice:585.00, trend:0.16, volatility:1.2 },
  { ticker:"ABBV",   name:"AbbVie Inc.",               sector:"Biopharmaceuticals",      group:"Pharmaceuticals",         basePrice:192.40, trend:0.22, volatility:1.3 },
  { ticker:"MRK",    name:"Merck & Co.",               sector:"Pharmaceuticals",         group:"Pharmaceuticals",         basePrice:110.20, trend:0.10, volatility:1.2 },
  { ticker:"PFE",    name:"Pfizer Inc.",               sector:"Pharmaceuticals",         group:"Pharmaceuticals",         basePrice:28.50,  trend:-0.05,volatility:1.4 },
  { ticker:"TMO",    name:"Thermo Fisher",             sector:"Life Sciences",           group:"Pharmaceuticals",         basePrice:575.60, trend:0.18, volatility:1.4 },
  { ticker:"ABT",    name:"Abbott Laboratories",       sector:"Medical Devices",         group:"Pharmaceuticals",         basePrice:116.80, trend:0.14, volatility:1.1 },
  { ticker:"ISRG",   name:"Intuitive Surgical",        sector:"Robotic Surgery",         group:"Pharmaceuticals",         basePrice:492.30, trend:0.38, volatility:1.9 },
  { ticker:"AMGN",   name:"Amgen Inc.",                sector:"Biotechnology",           group:"Pharmaceuticals",         basePrice:320.10, trend:0.12, volatility:1.3 },
  { ticker:"GILD",   name:"Gilead Sciences",           sector:"Biotechnology",           group:"Pharmaceuticals",         basePrice:85.40,  trend:0.18, volatility:1.5 },
  { ticker:"VRTX",   name:"Vertex Pharma",             sector:"Biotechnology",           group:"Pharmaceuticals",         basePrice:472.90, trend:0.26, volatility:1.6 },
  { ticker:"NFLX",   name:"Netflix Inc.",              sector:"Streaming Entertainment",  group:"Consumer Tech",          basePrice:718.50, trend:0.42, volatility:2.2 },
  { ticker:"WMT",    name:"Walmart Inc.",              sector:"Discount Retail",         group:"Consumer Tech",           basePrice:81.60,  trend:0.28, volatility:1.1 },
  { ticker:"COST",   name:"Costco Wholesale",          sector:"Warehouse Retail",        group:"Consumer Tech",           basePrice:912.40, trend:0.32, volatility:1.3 },
  { ticker:"UBER",   name:"Uber Technologies",         sector:"Mobility & Delivery",     group:"Consumer Tech",           basePrice:78.40,  trend:0.30, volatility:2.1 },
  { ticker:"ABNB",   name:"Airbnb Inc.",               sector:"Travel Tech",             group:"Consumer Tech",           basePrice:135.20, trend:0.15, volatility:2.0 },
  { ticker:"COIN",   name:"Coinbase Global",           sector:"Crypto Platform",         group:"Consumer Tech",           basePrice:215.00, trend:0.55, volatility:5.5 },
  { ticker:"XOM",    name:"Exxon Mobil",               sector:"Integrated Oil & Gas",    group:"Consumer Tech",           basePrice:122.40, trend:0.18, volatility:1.3 }
];
const STOCK_BY_TICKER = {};
US_STOCKS.forEach(s => STOCK_BY_TICKER[s.ticker] = s);

/* ============ 美股指数（合成，缓慢漂移） ============ */
const INDICES = [
  { key:"sp", name:"S&P 500", price:5864.20, vol:6,   prev:5826.66 },
  { key:"ns", name:"NASDAQ",  price:18518.61,vol:22,  prev:18310.10 },
  { key:"dj", name:"DOW",     price:43275.91,vol:45,  prev:43328.00 },
  { key:"vx", name:"VIX",     price:14.85,   vol:0.4, prev:15.38 }
];

/* ============ 运行时状态 ============ */
const rt = {};                       // ticker -> 运行时行情
let favList = [];                    // 收藏 ticker 列表
let visitorId = null;
let detailTicker = null;
let detailType = "live";
let detailKlineDays = 66;                 // K线周期：22≈1月, 66≈3月, 250≈1年（默认3月，比原40天更多数据）
const detailMaSet = new Set([5,10,20]);    // 显示的均线周期（可切换）

/* ============ 国际化（中 / 英） ============ */
const I18N = {
  zh: {
    "tab.home":"首页","tab.analyze":"分析","tab.featured":"精选","tab.favs":"收藏","tab.mine":"我的",
    "home.greet":"美股行情","home.hot":"热门异动",
    "analyze.greet":"市场分析","analyze.legendUp":"蓝色 · 看涨","analyze.legendDown":"黄色 · 看跌",
    "analyze.title":"AI 方向预测","analyze.sub":"蒙特卡洛 · 仅供参考","analyze.sector":"板块强弱",
    "analyze.high":"市场情绪乐观","analyze.mid":"市场中性震荡","analyze.low":"市场偏弱谨慎",
    "analyze.forecast":"14日预期","analyze.up":"看涨","analyze.down":"看跌",
    "featured.greet":"精选","featured.sub":"机构共识 · 今日推荐","featured.14d":"14日预期","featured.empty":"该板块暂无标的",
    "featured.reason":"%sec% 板块%trend%，模型 14 日预期 %gain%%，置信度 %conf%。",
    "featured.strong":"走强","featured.flat":"震荡",
    "set.title":"设置","set.dark":"深色模式","set.notify":"通知设置","set.general":"通用设置",
    "set.about":"关于我们","set.account":"账户设置","set.logout":"退出登录",
    "general.title":"通用设置","general.lang":"语言","general.clear":"清除本地缓存","general.about":"关于我们",
    "general.note":"缓存仅包含自选股与预测结果，清除不影响账户、收藏与价格提醒。",
    "fav.title":"我的收藏","fav.manage":"管理","fav.done":"完成","fav.del":"删除","fav.cancel":"取消",
    "fav.all":"全选","fav.selected":"已选","fav.countUnit":"只",
    "fav.loginView":"登录后查看收藏","fav.gate":"收藏需登录账号","fav.gateSub":"登录后自选股将同步到你的账户",
    "fav.goLogin":"去登录","fav.empty":"暂无收藏，去首页添加吧","fav.count":"共 %n% 只",
    "auth.title":"登录 / 注册","auth.login":"登录","auth.register":"注册",
    "auth.userPh":"用户名","auth.emailPh":"邮箱（注册必填）","auth.passPh":"密码（至少6位）",
    "auth.fill":"请输入用户名和密码","auth.badEmail":"请输入有效邮箱","auth.proc":"处理中…",
    "auth.fail":"操作失败","auth.noServer":"无法连接服务器，请先启动后端",
    "profile.guest":"游客","profile.notLogin":"未登录 · 点击登录","profile.loggedIn":"已登录 · 账户同步",
    "notify.title":"通知中心","notify.empty":"暂无通知","notify.allRead":"全部已读",
    "alert.title":"添加价格提醒","alert.above":"高于 ($)","alert.below":"低于 ($)","alert.save":"保存提醒","alert.hint":"不设置请留空",
    "account.hint":"点击下方表情或上传图片作为头像","account.upload":"上传图片","account.username":"用户名","account.save":"保存修改",
    "detail.live":"实时","detail.d7":"7天","detail.d14":"14天","detail.d30":"30天",
    "detail.open":"今开","detail.prev":"昨收","detail.high":"最高","detail.low":"最低","detail.vol":"成交量",
    "detail.engine":"AI 预测引擎","detail.engineSub":"蒙特卡洛 · 95% 置信带",
    "home.loadFail":"行情加载失败，请检查网络",
    "about.title":"关于我们","about.name":"StockScope 美股终端","about.ver":"版本 1.0.0",
    "about.desc":"StockScope 是一款面向个人投资者的轻量美股分析原型，集成实时行情速览、蒙特卡洛 AI 预测引擎与精选成长股，支持自选价格提醒。",
    "about.disc":"行情与预测均为原型演示数据（合成实时 + 模型测算），不构成任何投资建议。投资有风险，入市需谨慎。",
  },
  en: {
    "tab.home":"Home","tab.analyze":"Analysis","tab.featured":"Featured","tab.favs":"Favorites","tab.mine":"Me",
    "home.greet":"US Market","home.hot":"Top Movers",
    "analyze.greet":"Market Analysis","analyze.legendUp":"Blue · Bullish","analyze.legendDown":"Yellow · Bearish",
    "analyze.title":"AI Direction Forecast","analyze.sub":"Monte Carlo · For reference","analyze.sector":"Sector Strength",
    "analyze.high":"Optimistic Market","analyze.mid":"Neutral Range","analyze.low":"Cautious Weakness",
    "analyze.forecast":"14D Forecast","analyze.up":"Bullish","analyze.down":"Bearish",
    "featured.greet":"Featured","featured.sub":"Consensus · Today's Picks","featured.14d":"14D Forecast","featured.empty":"No stocks in this sector",
    "featured.reason":"%sec% sector %trend%; model 14-day forecast %gain%%, confidence %conf%.",
    "featured.strong":"strengthening","featured.flat":"ranging",
    "set.title":"Settings","set.dark":"Dark Mode","set.notify":"Notifications","set.general":"General",
    "set.about":"About Us","set.account":"Account","set.logout":"Log Out",
    "general.title":"General","general.lang":"Language","general.clear":"Clear Local Cache","general.about":"About Us",
    "general.note":"Cache holds watchlist & forecast results only. Clearing it does not affect your account, favorites or alerts.",
    "fav.title":"My Favorites","fav.manage":"Manage","fav.done":"Done","fav.del":"Delete","fav.cancel":"Cancel",
    "fav.all":"Select All","fav.selected":"Selected","fav.countUnit":"stocks",
    "fav.loginView":"Log in to view favorites","fav.gate":"Sign in required","fav.gateSub":"Your watchlist syncs to your account",
    "fav.goLogin":"Log In","fav.empty":"No favorites yet — add some from Home","fav.count":"%n% stocks",
    "auth.title":"Sign In / Sign Up","auth.login":"Log In","auth.register":"Sign Up",
    "auth.userPh":"Username","auth.emailPh":"Email (required for sign-up)","auth.passPh":"Password (min 6 chars)",
    "auth.fill":"Enter username and password","auth.badEmail":"Enter a valid email","auth.proc":"Processing…",
    "auth.fail":"Operation failed","auth.noServer":"Cannot reach server — please start the backend",
    "profile.guest":"Guest","profile.notLogin":"Not signed in · Tap to log in","profile.loggedIn":"Signed in · Synced",
    "notify.title":"Notifications","notify.empty":"No notifications","notify.allRead":"Mark all read",
    "alert.title":"Add Price Alert","alert.above":"Above ($)","alert.below":"Below ($)","alert.save":"Save Alert","alert.hint":"Leave blank if not set",
    "account.hint":"Tap an emoji or upload an image as avatar","account.upload":"Upload Image","account.username":"Username","account.save":"Save Changes",
    "detail.live":"Live","detail.d7":"7D","detail.d14":"14D","detail.d30":"30D",
    "detail.open":"Open","detail.prev":"Prev Close","detail.high":"High","detail.low":"Low","detail.vol":"Volume",
    "detail.engine":"AI Forecast Engine","detail.engineSub":"Monte Carlo · 95% band",
    "home.loadFail":"Failed to load quotes — check network",
    "about.title":"About Us","about.name":"StockScope US Terminal","about.ver":"Version 1.0.0",
    "about.desc":"StockScope is a lightweight US stock analysis prototype for individual investors, featuring real-time quotes, a Monte Carlo AI forecast engine and featured growth picks, plus price alerts.",
    "about.disc":"Quotes and forecasts are prototype data (synthesized real-time + model estimates) and do not constitute investment advice. Investing involves risk.",
  }
};
let LANG = "zh";
function T(key, vars){
  let s = (I18N[LANG] && I18N[LANG][key]) || I18N.zh[key] || key;
  if (vars) for (const k in vars) s = s.split("%" + k + "%").join(vars[k]);
  return s;
}
function applyLang(){
  document.documentElement.setAttribute("lang", LANG);
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const k = el.getAttribute("data-i18n");
    if (k) el.textContent = T(k);
  });
  const sel = $("#lang-select"); if (sel) sel.value = LANG;
  // 重新渲染动态文案
  try { renderHome(); renderAnalyze(); renderFeatured("all"); renderFav(); renderProfile(); } catch(e){}
}

/* ============ 工具 ============ */
const $  = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const rnd = (a,b) => a + Math.random()*(b-a);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const getCss = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function hexA(hex, a){
  hex = (hex||"").replace("#","");
  if (hex.length===3) hex = hex.split("").map(c=>c+c).join("");
  const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}
function fmtVol(v){
  if (v==null||isNaN(v)) return "—";
  if (v>=1e9) return (v/1e9).toFixed(2)+"B";
  if (v>=1e6) return (v/1e6).toFixed(2)+"M";
  if (v>=1e3) return (v/1e3).toFixed(2)+"K";
  return Math.round(v).toString();
}

/* ============ 合成实时引擎 ============ */
// 生成自然日内路径：起点=from(昨收) → 终点=to(当前价)，中间平滑趋势 + 多频率波动。
// 波动相位由 ticker 决定 → 每只股票形态不同；两端严格贴合端点（无"平线+突跳"）。
function genHist(s, from, to, n){
  n = n || 40;
  const c1 = s.ticker.length, c2 = (s.ticker.charCodeAt(0)||7), c3 = (s.ticker.charCodeAt(1)||13);
  const out = [];
  for (let i=0;i<n;i++){
    const t = i/(n-1);
    const base = from + (to-from)*t;                       // 日内趋势线
    const amp  = s.volatility * 0.0026 * base;             // 波动幅度 ∝ 日波动率
    const wave = Math.sin(t*Math.PI*2.6 + c1) * 0.6
               + Math.sin(t*Math.PI*5.3 + c2) * 0.35
               + Math.sin(t*Math.PI*9.1 + c3) * 0.15
               + (Math.random()-0.5) * 0.4;                // 每次生成略有随机差异
    const env  = Math.sin(Math.PI * t);                    // 两端收束、中间活跃
    out.push(Math.max(0.01, base + wave*amp*env));
  }
  out[0] = from; out[n-1] = to;
  return out.map(v=>+v.toFixed(2));
}
function seedStock(s){
  const prevClose = s.basePrice;                                  // 真实价作为昨收锚点
  const dayPct = (Math.random()-0.5) * Math.min(s.volatility,8) * 0.9;  // 当日涨跌幅 ±~4%
  const price  = Math.max(1, +(prevClose * (1 + dayPct/100)).toFixed(2));
  const hist = genHist(s, prevClose, price);
  return {
    price,
    prevClose,
    open: +(prevClose * (1 + (Math.random()-0.5)*s.volatility*0.2/100)).toFixed(2),
    high: Math.max(...hist, price),
    low: Math.min(...hist, price),
    volume: Math.round(rnd(8,90))*1e6,
    hist
  };
}
function tickStock(s, r){
  const noisePct = (Math.random()-0.5) * s.volatility * 0.25;
  const driftPct = s.trend * 0.02;
  const revert   = (r.prevClose - r.price) * 0.02;                // 轻微拉回真实价
  r.price = Math.max(1, +(r.price * (1 + (noisePct + driftPct + revert)/100)).toFixed(2));
  r.high = Math.max(r.high, r.price);
  r.low  = Math.min(r.low, r.price);
  r.hist.push(r.price); if (r.hist.length>60) r.hist.shift();
  r.volume += Math.round(rnd(0.2,3)*1e6);
}
function dayChg(s, r){ return (r.price - r.prevClose) / r.prevClose * 100; }

/* ============ 技术面信号（增强判断逻辑） ============ */
function maOf(arr, n){ const s = arr.slice(-n); return s.length ? s.reduce((a,b)=>a+b,0)/s.length : (arr[arr.length-1]||0); }
function rsiOf(arr, period){
  period = period || 14;
  if (!arr || arr.length <= period) return 50;
  let g=0, l=0;
  for (let i=arr.length-period; i<arr.length; i++){ const ch=arr[i]-arr[i-1]; if (ch>=0) g+=ch; else l-=ch; }
  if (g+l===0) return 50;
  const rs = g/l;
  return 100 - 100/(1+rs);
}
function momOf(arr, win){
  win = Math.min(win||10, arr.length-1);
  if (win<1) return 0;
  const seg = arr.slice(-(win+1));
  let tot=0; for (let i=1;i<seg.length;i++) tot += (seg[i]-seg[i-1])/seg[i-1];
  return tot/win; // 近 win 日平均日收益率
}

// 计算技术面信号：动量 / RSI 均值回归 / 均线金叉死叉,并合成有效漂移与共振度
function calcSignals(hist, s){
  const out = { mom:0, rsi:50, ma5:0, ma20:0, momS:0, rsiS:0, maS:0, tech:0, agreement:0, driftBase:s.trend*0.4 };
  if (hist && hist.length >= 6){
    const m = momOf(hist, 10); out.mom = m;
    out.momS = clamp(m*6, -0.45, 0.45);
    const rsi = rsiOf(hist, 14); out.rsi = rsi;
    out.rsiS = (50 - rsi)/50 * 0.22;
    if (hist.length >= 20){
      const m5=maOf(hist,5), m20=maOf(hist,20); out.ma5=m5; out.ma20=m20;
      out.maS = clamp((m5-m20)/m20 * 10, -0.30, 0.30);
    }
    out.tech = out.momS + out.rsiS + out.maS;
    out.agreement = (Math.sign(s.trend||0) === Math.sign(out.tech)) ? 4 : -3;
  }
  out.driftBase = s.trend*0.4 + out.momS + out.rsiS + out.maS;
  return out;
}

/* ============ 蒙特卡洛 AI 预测引擎（朋友 JR Stock Terminal） ============ */
// 多路径蒙特卡洛预测：跑 N 条独立随机游走,取每日分位数作置信带,中位数作中心路径
// 默认 120 路径(列表页流畅);详情页单股用 MC_DETAIL_PATHS 跑更密
const MC_PATHS = 120;
const MC_DETAIL_PATHS = 300;
function forecast(s, r, horizon, mcPaths){
  const last = r.price;
  const hist = r.hist.slice();
  const hLen = hist.length;
  const N = mcPaths || MC_PATHS;
  const labels = hist.map((_,i)=>"T"+(i+1));
  const histSeries = hist.concat(Array(horizon).fill(null));
  const fcSeries   = Array(hLen-1).fill(null); fcSeries.push(last);
  const upper = Array(hLen-1).fill(null); upper.push(last);
  const lower = Array(hLen-1).fill(null); lower.push(last);
  // —— 技术面信号：动量 / RSI 均值回归 / 均线金叉死叉（增强判断逻辑）——
  const sig = calcSignals(hist, s);
  // 有效日漂移 = 静态趋势 + 技术面修正（噪声仍零均值对称）
  const driftBase = sig.driftBase;

  // grid[i] = 第 i 天(1-based) N 条路径的价格; pathsArr 存完整路径用于抽样显示
  const grid = [];
  const pathsArr = [];
  for (let p=0; p<N; p++){
    let price = last; const path = [last];
    for (let i=1;i<=horizon;i++){
      // 每日收益率(%): 有效漂移(趋势+技术面) + 零均值对称噪声(volatility)
      const driftPct = driftBase + (Math.random()-0.5) * (s.volatility*0.4);
      price = Math.max(1, price * (1 + driftPct/100));
      path.push(price);
      (grid[i] || (grid[i]=[])).push(price);
    }
    pathsArr.push(path);
  }
  const pct = (arr, q) => { const a=arr.slice().sort((x,y)=>x-y); const idx=(a.length-1)*q, lo=Math.floor(idx), hi=Math.ceil(idx); return a[lo] + (a[hi]-a[lo])*(idx-lo); };
  for (let i=1;i<=horizon;i++){
    labels.push("D"+i);
    const arr = grid[i];
    fcSeries.push(+pct(arr,0.5).toFixed(2));   // 中位数 = 中心预测路径
    lower.push(+pct(arr,0.10).toFixed(2));     // 10% 分位
    upper.push(+pct(arr,0.90).toFixed(2));     // 90% 分位
  }
  // 分层抽样：按终值排序,取 M 条代表路径(覆盖全分布)用于图表叠加显示
  const M = 16;
  const sorted = pathsArr.slice().sort((a,b)=>a[a.length-1]-b[b.length-1]);
  const paths = [];
  for (let k=0;k<M;k++){ const idx = Math.round(k*(sorted.length-1)/(M-1)); paths.push(sorted[idx].map(v=>+v.toFixed(2))); }

  const target = fcSeries[fcSeries.length-1];
  const gain = (target - last) / last * 100;
  const bias = gain >= 0 ? "bullish" : "bearish";
  const finals = grid[horizon];
  const upProb = finals.filter(v=>v>=last).length / finals.length;   // 终值 ≥ 现价 的概率
  const confidence = clamp(Math.round(80 - s.volatility*2.0 + (driftBase>=0?5:-3) + sig.agreement), 45, 96);
  return { labels, histSeries, fcSeries, upper, lower, target, gain, bias, confidence, upProb, last, paths, signals:sig };
}

/* ============ 市场状态（美东时间） ============ */
function estParts(){
  const p = new Intl.DateTimeFormat("en-US",{ timeZone:"America/New_York", hour12:false,
    weekday:"short", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit" })
    .formatToParts(new Date()).reduce((a,x)=>{ a[x.type]=x.value; return a; }, {});
  return p; // {weekday, year, month, day, hour, minute, second}
}
function marketOpen(){
  const p = estParts();
  const day = {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[p.weekday];
  if (day===0 || day===6) return false;
  const mins = parseInt(p.hour,10)*60 + parseInt(p.minute,10);
  return mins >= 9*60+30 && mins < 16*60; // 9:30-16:00 ET
}

/* ============ 后端埋点（游客 + 浏览，best-effort） ============ */
// file:// 直接打开时连本机后端；经后端访问(index.html 由后端托管)时同源
const API_BASE = (location.protocol==="file:") ? "http://localhost:8080" : "";
function ensureVisitor(){
  try {
    visitorId = localStorage.getItem("stockscope_visitor");
    if (!visitorId){
      visitorId = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("stockscope_visitor", visitorId);
    }
  } catch(e){}
}
function trackView(code){
  if (!code) return;
  try {
    fetch(API_BASE + "/api/view", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ visitor: visitorId, code, t: Date.now() })
    }).catch(()=>{});
  } catch(e){}
}

/* ============ 真实行情（后端代理 /api/quotes，回退合成） ============ */
let USING_REAL = false;
// 节奏常量（毫秒）—— 开盘时价格要“够快”
const TICK_OPEN_MS   = 100;   // 开盘：本地跳动 / 微波动间隔 (0.1s)
const TICK_CLOSED_MS = 2000;  // 休市：合成跳动间隔
const REAL_POLL_MS   = 1000;  // 开盘：向真实接口拉取校正的间隔 (1s)
// 用真实价生成一段贴合当前价的分时形态（仅供图表展示历史段）
function buildHist(s, price, prevClose){
  return genHist(s, prevClose, price);
}
// 拉取真实日 K（新浪，后端代理）：成功后用真实收盘序列替换历史段（锁定），失败保持合成回退
const _klineCache = {};
// 按 ticker|days 缓存，支持多周期（1月/3月/1年）各自拉取一次
async function loadKline(t, days){
  days = days || 40;
  const key = t + "|" + days;
  if (_klineCache[key] != null) return _klineCache[key];
  _klineCache[key] = false;
  const s = STOCK_BY_TICKER[t]; if (!s) return false;
  try {
    const res = await fetch(API_BASE + "/api/kline?symbol=" + encodeURIComponent(t) + "&days=" + days, {cache:"no-store"});
    if (!res.ok) throw 0;
    const d = await res.json();
    const kl = (d.kline||[]).filter(k=>k && k.close>0);
    if (kl.length < 5) throw 0;
    const r = rt[t]; if (!r) return false;
    r.klineByDays = r.klineByDays || {};
    r.klineByDays[days] = kl;            // 各周期独立存，避免重复拉取
    _klineCache[key] = true;
    return true;
  } catch(e){ return false; }
}
// 把当前选中周期的日 K 应用到 r.kline / r.hist（蜡烛图与预测共用同一序列，保证坐标一致）
function applyKlinePeriod(t){
  const r = rt[t]; if (!r || !r.klineByDays) return false;
  const kl = r.klineByDays[detailKlineDays];
  if (!kl || !kl.length) return false;
  r.kline  = kl;                        // 真实 OHLC（含日期）
  r.hist   = kl.map(k=>k.close);        // 真实收盘序列（折线/预测共用）
  r.prevClose = kl[kl.length-1].close;  // 昨收=最新日K收盘
  r.histLocked = true;
  return true;
}
async function loadRealQuotes(){
  try {
    const symbols = US_STOCKS.map(s=>s.ticker).join(",");
    const res = await fetch(API_BASE + "/api/quotes?symbols=" + encodeURIComponent(symbols), {cache:"no-store"});
    if (!res.ok) throw new Error("bad status "+res.status);
    const data = await res.json();
    if (!data.quotes || !data.quotes.length) throw new Error("empty");
    let ok=0;
    data.quotes.forEach(q=>{
      const s = STOCK_BY_TICKER[q.ticker];
      if (!s) return;
      const prevClose = q.prevClose!=null ? q.prevClose : s.basePrice;
      const price    = q.price!=null ? q.price : s.basePrice;
      const old = rt[q.ticker];
      // 历史段锁定：首次生成后不再整段重建（过去的价格走势不动），只把最新点对齐真实价
      let hist;
      if (old && old.hist && old.hist.length){
        hist = old.hist.slice();
        if (old.histLocked!==false) hist[hist.length-1] = price;
      } else {
        hist = buildHist(s, price, prevClose);
      }
      rt[q.ticker] = {
        price, prevClose, realPrice: price, histLocked: true,
        open:  q.open!=null  ? q.open  : price,
        high:  q.high!=null  ? q.high  : Math.max(price, old ? old.high : price),
        low:   q.low!=null   ? q.low   : Math.min(price, old ? old.low : price),
        volume: old ? old.volume : Math.round(rnd(8,90))*1e6,
        hist
      };
      ok++;
    });
    if (ok===0) throw new Error("none matched");
    USING_REAL = true;
  } catch(e){ /* 保持合成回退 */ }
}
async function loadRealIndices(){
  try {
    const res = await fetch(API_BASE + "/api/indices", {cache:"no-store"});
    if (!res.ok) throw 0;
    const d = await res.json();
    const I = d.indices||{};
    const put=(i,obj)=>{ if(obj&&obj.price!=null){ INDICES[i].price=obj.price; INDICES[i].realPrice=obj.price; INDICES[i].prev=obj.prevClose!=null?obj.prevClose:INDICES[i].prev; } };
    put(0,I.sp); put(1,I.ns); put(2,I.dj); put(3,I.vx);
  } catch(e){}
}
function renderActive(){
  const active = $$(".tab").find(t=>t.classList.contains("active"));
  const tab = active?active.dataset.target:"home";
  if (tab==="home") renderHome();
  else if (tab==="analyze") renderAnalyze();
  else if (tab==="featured"){ const cur=$("#chips .chip.active"); renderFeatured(cur?cur.dataset.sector:"all"); }
  else if (tab==="favorites") renderFav();
  if (detailTicker && $("#page-detail").classList.contains("open")){
    const s=STOCK_BY_TICKER[detailTicker]; renderDetailQuote(s, rt[detailTicker]); renderForecastCards();
    loadAndDraw(detailType);
  }
}
async function refreshReal(){
  await Promise.all([loadRealQuotes(), loadRealIndices()]);
  updateLive();   // 就地平滑更新，不重建列表
}
function startRealData(){
  // 先尝试一次真实数据；成功则开盘时每 1s 校正真实价（休市不拉取），否则保留合成跳动
  loadRealQuotes().then(()=>loadRealIndices()).then(()=>{
    renderIndices(); renderActive();
    if (USING_REAL) setInterval(()=>{ if (marketOpen()) refreshReal(); }, REAL_POLL_MS);
  });
}

/* ============ 渲染：迷你走势 ============ */
function sparkPoints(trend, w, h){
  w=w||64; h=h||30;
  if (!trend || trend.length<2) trend=[10,11,10,12,11,13,12,14];
  const max=Math.max(...trend), min=Math.min(...trend), span=max-min||1;
  return trend.map((v,i)=>`${(i/(trend.length-1)*w).toFixed(1)},${(h-(v-min)/span*(h-4)-2).toFixed(1)}`).join(" ");
}
function sparkline(trend, up){
  const w=64, h=30;
  const pts = sparkPoints(trend, w, h);
  return `<svg class="si-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${up?"var(--green)":"var(--red)"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/* ============ 数字缓动补间（消除瞬跳） ============ */
// el._v 记录当前显示值；每次调用从当前显示值平滑过渡到 to（easeOutCubic）
function tweenNumber(el, to, fmt, dur){
  if (!el) return;
  dur = dur || 240;
  const from = (typeof el._v === "number" && isFinite(el._v)) ? el._v : to;
  if (el._raf) cancelAnimationFrame(el._raf);
  const start = (typeof performance!=="undefined" ? performance.now() : Date.now());
  const step = (now) => {
    const t = Math.min(1, (now-start)/dur);
    const e = 1 - Math.pow(1-t, 3);
    const v = from + (to-from)*e;
    el._v = v;
    el.textContent = fmt(v);
    if (t < 1) el._raf = requestAnimationFrame(step);
    else { el._v = to; el.textContent = fmt(to); el._raf = null; }
  };
  el._raf = requestAnimationFrame(step);
}

/* ============ 实时平滑更新（就地更新，不重建列表） ============ */
function updateLive(){
  document.querySelectorAll("[data-ticker]").forEach(li=>{
    const t = li.dataset.ticker; const r = rt[t]; if (!r) return;
    const s = STOCK_BY_TICKER[t]; if (!s) return;
    const chg = dayChg(s,r), up = chg>=0, sign = up?"+":"";
    const priceEl = li.querySelector(".si-price") || li.querySelector(".fc-price");
    if (priceEl){
      const prevV = (typeof priceEl._v === "number") ? priceEl._v : r.price;
      const dir = r.price >= prevV ? "up" : "down";
      if (priceEl._dir !== dir){ priceEl._dir = dir; priceEl.classList.remove("flash-up","flash-down"); void priceEl.offsetWidth; priceEl.classList.add(dir==="up"?"flash-up":"flash-down"); }
      tweenNumber(priceEl, r.price, v=>`$${v.toFixed(2)}`);
    }
    const chgEl = li.querySelector(".si-chg");
    if (chgEl){ chgEl.textContent = `${sign}${chg.toFixed(2)}%`; chgEl.className = "si-chg "+(up?"up":"down"); }
    const sp = li.querySelector(".si-spark polyline");
    if (sp) sp.setAttribute("points", sparkPoints(r.hist, up));
  });
  renderIndices();
  if (detailTicker && $("#page-detail").classList.contains("open")){
    renderDetailQuote(STOCK_BY_TICKER[detailTicker], rt[detailTicker]);
  }
}
function stockItem(ticker){
  const s = STOCK_BY_TICKER[ticker]; if (!s) return "";
  const r = rt[ticker]; if (!r) return "";
  const chg = dayChg(s,r), up = chg>=0, sign = up?"+":"";
  return `<li class="stock-item" data-ticker="${ticker}">
    <div><div class="si-name">${s.name}</div><div class="si-code">${ticker} · ${s.sector}</div></div>
    ${sparkline(r.hist, up)}
    <div class="si-right"><div class="si-price">$${r.price.toFixed(2)}</div>
      <div class="si-chg ${up?"up":"down"}">${sign}${chg.toFixed(2)}%</div></div>
  </li>`;
}

/* ============ 首页：指数 + 热门异动 ============ */
function renderIndices(){
  const sp = INDICES[0], ns = INDICES[1], dj = INDICES[2], vx = INDICES[3];
  tweenNumber($("#idx-sp-val"), sp.price, v=>v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}));
  const c1 = (sp.price-sp.prev)/sp.prev*100;
  const e1 = $("#idx-sp-pct"); e1.textContent = (c1>=0?"+":"")+c1.toFixed(2)+"%"; e1.className="mh-chip "+(c1>=0?"up":"down");
  const setFoot = (id, idx) => { const c=(idx.price-idx.prev)/idx.prev*100; const el=$("#"+id); if(el){ el.textContent=(c>=0?"+":"")+c.toFixed(2)+"%"; el.className=c>=0?"up":"down"; } };
  setFoot("idx-ns-pct", ns); setFoot("idx-dj-pct", dj); setFoot("idx-vx-pct", vx);
}
function renderHome(){
  renderIndices();
  const movers = US_STOCKS.map(s => ({ s, chg: dayChg(s, rt[s.ticker]) }))
    .sort((a,b)=> Math.abs(b.chg) - Math.abs(a.chg))
    .slice(0, 8)
    .map(x => x.s.ticker);
  $("#home-list").innerHTML = movers.length
    ? movers.map(stockItem).join("")
    : `<li class="sp-empty">${T("home.loadFail")}</li>`;
}

/* ============ 分析页：市场热度 + AI 方向预测 + 板块强弱 ============ */
function renderAnalyze(){
  // 市场热度 = 全市场平均绝对涨跌幅映射 0-100
  const avgAbs = US_STOCKS.reduce((a,s)=>a+Math.abs(dayChg(s,rt[s.ticker])),0)/US_STOCKS.length;
  const score = clamp(Math.round(avgAbs*14 + 30), 0, 100);
  $("#gauge-score").innerHTML = score + "<small>/100</small>";
  $("#gauge-label").textContent = score>=70?T("analyze.high"):score>=45?T("analyze.mid"):T("analyze.low");
  const arc = $("#gauge-arc"); const L = arc.getTotalLength();
  const f = score/100;
  arc.style.strokeDasharray = L; arc.style.strokeDashoffset = L*(1-f);
  const ang = Math.PI*(1-f); const cx=60+50*Math.cos(ang), cy=60-50*Math.sin(ang);
  $("#gauge-dot").setAttribute("cx", cx.toFixed(1)); $("#gauge-dot").setAttribute("cy", cy.toFixed(1));

  // AI 方向预测（14 日）：按绝对预期收益排序，取前 8
  const ranked = US_STOCKS.map(s => {
    const fc = forecast(s, rt[s.ticker], 14);
    return { s, fc };
  }).sort((a,b)=> Math.abs(b.fc.gain) - Math.abs(a.fc.gain)).slice(0,8);
  $("#pred-list").innerHTML = ranked.map(({s,fc})=>{
    const up = fc.gain>=0, cls = up?"pred-up":"pred-down", sign=up?"+":"";
    return `<li class="pred-row" data-ticker="${s.ticker}">
      <div class="pr-left"><div class="pr-name">${s.name}</div><div class="pr-code">${s.ticker} · ${T("analyze.forecast")}</div></div>
      <div class="pr-right"><div class="pr-val ${cls}">${sign}${fc.gain.toFixed(1)}%</div><div class="pr-tag">${up?T("analyze.up"):T("analyze.down")}</div></div>
    </li>`;
  }).join("");

  // 板块强弱（按 group 聚合平均涨跌幅）
  const groups = {};
  US_STOCKS.forEach(s=>{
    const c = dayChg(s, rt[s.ticker]);
    if (!groups[s.group]) groups[s.group] = { sum:0, n:0 };
    groups[s.group].sum += c; groups[s.group].n++;
  });
  const rows = Object.entries(groups).map(([g,v])=>({ g, chg: v.sum/v.n }))
    .sort((a,b)=> b.chg - a.chg);
  $("#sector-list").innerHTML = rows.map(r=>{
    const up = r.chg>=0;
    return `<li class="sector-item"><span class="sector-name">${r.g}</span>
      <span class="${up?"up":"down"}" style="font-weight:700">${up?"▲":"▼"} ${Math.abs(r.chg).toFixed(2)}%</span></li>`;
  }).join("");
}

/* ============ 精选页：按板块 ============ */
function renderFeatured(sector){
  sector = sector || "all";
  const list = sector==="all" ? US_STOCKS : US_STOCKS.filter(s=>s.group===sector);
  $("#featured-list").innerHTML = list.length ? list.map(s=>{
    const r = rt[s.ticker];
    const chg = dayChg(s,r), up = chg>=0, sign=up?"+":"";
    const fc = forecast(s, r, 14);
    const wkUp = fc.gain>=0;
    const sectorUp = (US_STOCKS.filter(x=>x.group===s.group).reduce((a,x)=>a+dayChg(x,rt[x.ticker]),0))>=0;
    const reason = T("featured.reason", {
      sec: s.sector,
      trend: sectorUp ? T("featured.strong") : T("featured.flat"),
      gain: (fc.gain>=0?"+":"") + fc.gain.toFixed(1),
      conf: fc.confidence
    });
    return `<li class="fc-card" data-ticker="${s.ticker}">
      <div class="fc-top"><span class="fc-tag">${s.group}</span>
        <span class="fc-week ${wkUp?"pred-up":"pred-down"}">${T("featured.14d")} ${wkUp?"+":""}${fc.gain.toFixed(1)}%</span></div>
      <div class="fc-name">${s.name} <span class="fc-code">${s.ticker}</span></div>
      <div class="fc-price">$${r.price.toFixed(2)} <b class="${up?"up":"down"}">${sign}${chg.toFixed(2)}%</b></div>
      <div class="fc-reason">${reason}</div>
    </li>`;
  }).join("") : `<li class="sp-empty">${T("featured.empty")}</li>`;
}

/* ============ 收藏（登录后可用，按用户存后端，离线回退本地） ============ */
async function loadFav(){
  const u = loadUser();
  if (!u || !u.token){ favList = []; return; }
  try {
    const r = await fetch(API_BASE + "/api/watchlist", {
      headers: { "Authorization": "Bearer " + u.token }
    });
    if (r.ok){
      const d = await r.json();
      favList = (d.watchlist || []).filter(t=>STOCK_BY_TICKER[t]);
      renderFav(); return;
    }
  } catch(e){}
  // 离线回退：按用户名隔离的本地自选
  try {
    const w = JSON.parse(localStorage.getItem("us-fav-" + u.name));
    favList = (Array.isArray(w) ? w : []).filter(t=>STOCK_BY_TICKER[t]);
  } catch(e){ favList = []; }
  renderFav();
}
function cacheFav(){
  const u = loadUser();
  if (u && u.name){ try { localStorage.setItem("us-fav-"+u.name, JSON.stringify(favList)); } catch(e){} }
}
function remoteToggle(t){
  // 后端同步（删除场景，best-effort；失败静默）
  const u = loadUser();
  if (!u || !u.token) return;
  fetch(API_BASE + "/api/watchlist/toggle", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":"Bearer "+u.token},
    body: JSON.stringify({ ticker: t })
  }).catch(()=>{});
}
function isFav(t){ return favList.includes(t); }
async function toggleFav(t){
  const u = loadUser();
  if (!u || !u.token){ openMask("auth-mask"); return; }
  try {
    const r = await fetch(API_BASE + "/api/watchlist/toggle", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+u.token},
      body: JSON.stringify({ ticker: t })
    });
    if (r.ok){
      const d = await r.json();
      favList = (d.watchlist || []).filter(x=>STOCK_BY_TICKER[x]);
      cacheFav(); renderFav(); return;
    }
  } catch(e){}
  // 离线回退：本地按用户切换
  if (favList.includes(t)) favList = favList.filter(x=>x!==t);
  else favList.unshift(t);
  cacheFav(); renderFav();
}
function renderFav(){
  const u = loadUser();
  if (!u || !u.token){
    $("#fav-sub").textContent = T("fav.loginView");
    $("#fav-list").innerHTML = `<li class="sp-empty login-gate">
      <div class="lg-ico">🔒</div>
      <div class="lg-txt">${T("fav.gate")}</div>
      <div class="lg-sub">${T("fav.gateSub")}</div>
      <button class="auth-btn sm" id="fav-login-btn">${T("fav.goLogin")}</button>
    </li>`;
    const b = $("#fav-login-btn"); if (b) b.addEventListener("click", ()=>openMask("auth-mask"));
    return;
  }
  $("#fav-sub").textContent = T("fav.count", { n: favList.length });
  const ul = $("#fav-list");
  if (!favList.length){ ul.innerHTML = `<li class="sp-empty">${T("fav.empty")}</li>`; return; }
  ul.innerHTML = favList.map(t=>{
    const s = STOCK_BY_TICKER[t]; if (!s) return "";
    const r = rt[t]; const chg = dayChg(s,r), up=chg>=0, sign=up?"+":"";
    const editing = favManage ? "editing" : "";
    const selected = (favSel.has(t) && favManage) ? "selected" : "";
    return `<li class="fav-row ${editing} ${selected}" data-ticker="${t}">
      <div class="fav-del-btn">${T("fav.del")}</div>
      <div class="fav-row-inner">
        <div class="fav-check"></div>
        <div><div class="si-name">${s.name}</div><div class="si-code">${t}</div></div>
        ${sparkline(r.hist, up)}
        <div class="si-right"><div class="si-price">$${r.price.toFixed(2)}</div>
          <div class="si-chg ${up?"up":"down"}">${sign}${chg.toFixed(2)}%</div></div>
      </div></li>`;
  }).join("");
}

/* ============ 搜索（美股） ============ */
function searchUS(kw){
  kw = kw.trim().toLowerCase(); if (!kw) return [];
  return US_STOCKS.filter(s =>
    s.ticker.toLowerCase().includes(kw) ||
    s.name.toLowerCase().includes(kw) ||
    s.sector.toLowerCase().includes(kw) ||
    (s.group && s.group.toLowerCase().includes(kw))
  ).slice(0, 25);
}
function renderSearch(items){
  const p = $("#search-panel");
  if (!items.length){ p.innerHTML = `<div class="sp-empty">未找到相关美股</div>`; return; }
  p.innerHTML = `<div class="sp-hint">点击查看详情，+ 加入自选</div>` + items.map(s=>{
    const r = rt[s.ticker]; const chg = dayChg(s,r), up=chg>=0, sign=up?"+":"";
    return `<div class="sp-item" data-ticker="${s.ticker}">
      <div><div class="sp-name">${s.name}</div><div class="sp-code">${s.ticker} · ${s.sector}</div></div>
      <div class="sp-right" style="text-align:right;margin-left:auto">
        <div class="si-price">$${r.price.toFixed(2)}</div>
        <div class="si-chg ${up?"up":"down"}" style="font-size:12px;font-weight:700">${sign}${chg.toFixed(2)}%</div>
      </div>
      <div class="sp-add">+</div></div>`;
  }).join("");
}
function setupSearch(){
  const input=$("#search-input"), panel=$("#search-panel"), clear=$("#search-clear"), loading=$("#search-loading");
  let timer=null;
  input.addEventListener("focus", ()=>{ if (input.value.trim()) panel.hidden=false; });
  input.addEventListener("input", ()=>{
    const kw=input.value.trim(); clear.hidden=!kw;
    if (!kw){ panel.hidden=true; return; }
    loading.hidden=false; panel.hidden=false; clearTimeout(timer);
    timer=setTimeout(()=>{
      try { renderSearch(searchUS(kw)); } catch(e){ panel.innerHTML=`<div class="sp-empty">搜索服务暂不可用</div>`; }
      finally { loading.hidden=true; }
    }, 250);
  });
  clear.addEventListener("click", ()=>{ input.value=""; clear.hidden=true; panel.hidden=true; input.focus(); });
  panel.addEventListener("click", (e)=>{
    const add = e.target.closest(".sp-add");
    const item = e.target.closest(".sp-item");
    if (!item) return;
    const t = item.dataset.ticker;
    if (add){ e.stopPropagation(); if (!isFav(t)){ toggleFav(t); } add.textContent="✓"; return; }
    openDetail(t);
  });
  document.addEventListener("click", e=>{ if (!e.target.closest(".search-wrap")) panel.hidden=true; });
}

/* ============ 详情页：预测图（Canvas） ============ */
function fitCanvas(cv){
  const dpr = window.devicePixelRatio || 1;
  const r = cv.getBoundingClientRect();
  const w = Math.max(1, r.width), h = Math.max(1, r.height);
  cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr);
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr,0,0,dpr,0,0);
  return { ctx, w, h };
}
// 统一绘制：hist(绿/红实线) + fc(蓝/黄虚线·按方向) + 置信带(同色透明)
// 有真实日 K 时：上方价格区画 OHLC 蜡烛 + MA5/10/20 + 轻微网格，下方画成交量
function drawSeries(series){
  if (series) _lastSeries = series;
  const cv = $("#chart-canvas"); const { ctx, w, h } = fitCanvas(cv);
  ctx.clearRect(0,0,w,h);
  if (!series || !series.hist || series.hist.length<2){ ctx.fillStyle=getCss("--text-2"); ctx.font="13px sans-serif"; ctx.fillText("暂无数据",14,24); return; }
  const padL=4, padR=46, padT=14, padB=22;
  const plotW=w-padL-padR;
  const klineArr = (series.kline && series.kline.length) ? series.kline : null;
  const hasK = !!klineArr;
  // 布局：真实日 K → 价格区(上) + 成交量区(下)；否则单区
  const totalH = h - padT - padB;
  let priceH, volTop=0, volH=0;
  if (hasK){ priceH = totalH * 0.72; volTop = padT + priceH + 8; volH = h - volTop - padB; }
  else { priceH = totalH; }
  const clean = a => (a||[]).filter(v=>v!=null&&!isNaN(v));
  const priceExtras = hasK ? klineArr.flatMap(k=>[k.high, k.low]) : [];
  const all = clean([...series.hist, ...(series.fc||[]), ...(series.upper||[]), ...(series.lower||[]), ...priceExtras]);
  if (!all.length){ ctx.fillStyle=getCss("--text-2"); ctx.font="13px sans-serif"; ctx.fillText("暂无数据",14,24); return; }
  let min=Math.min(...all), max=Math.max(...all); const span=(max-min)||1;
  min-=span*0.08; max+=span*0.08; const S=(max-min)||1;
  // X 轴按「历史 + 预测」总长度归一化：预测段从历史终点向右延伸
  let fcEnd = series.hist.length;
  (series.fc||[]).forEach((v,i)=>{ if (v!=null&&!isNaN(v)) fcEnd=Math.max(fcEnd, i+1); });
  (series.upper||[]).forEach((v,i)=>{ if (v!=null&&!isNaN(v)) fcEnd=Math.max(fcEnd, i+1); });
  const totalN = Math.max(series.hist.length, fcEnd, 2);
  const X = i => padL + (i/(totalN-1))*plotW;
  const Y = v => padT + (1-(v-min)/S)*priceH;
  // 颜色先算好（避免 TDZ：predCol 在置信带分支里就要用）
  const nonNull = clean(series.hist);
  const up = nonNull.length>1 ? nonNull[nonNull.length-1] >= nonNull[0] : true;
  const col = up ? getCss("--green") : getCss("--red");
  // 预测按方向取色：看涨=蓝(pred-up) 看跌=黄(pred-down)
  const predCol = (series.bias==='down') ? getCss("--pred-down") : getCss("--pred-up");

  // 价格区横向网格（轻微，仅蜡烛图）
  if (hasK){
    ctx.strokeStyle = getCss("--line"); ctx.lineWidth = 1;
    for (let g=1; g<4; g++){ const y = padT + priceH*g/4; ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+plotW,y); ctx.stroke(); }
  }
  // 置信带
  if ((series.upper||[]).some(v=>v!=null)){
    ctx.beginPath(); let started=false;
    for (let i=0;i<series.upper.length;i++){ const v=series.upper[i]; if (v==null||isNaN(v)) continue; const x=X(i),y=Y(v); if(!started){ctx.moveTo(x,y);started=true;} else ctx.lineTo(x,y); }
    for (let i=series.lower.length-1;i>=0;i--){ const v=series.lower[i]; if (v==null||isNaN(v)) continue; ctx.lineTo(X(i),Y(v)); }
    ctx.closePath(); ctx.fillStyle=hexA(predCol,0.16); ctx.fill();
  }
  // 蒙特卡洛抽样路径（其他预测线）：在预测区叠加 M 条代表路径,呈现分布形态
  if (series.paths && series.paths.length && (series.fc||[]).some(v=>v!=null)){
    const fcStart = (series.fc||[]).findIndex(v=>v!=null);   // 预测起点索引(= 历史终点的 last)
    if (fcStart >= 0){
      ctx.strokeStyle = hexA(predCol, 0.10);
      ctx.lineWidth = 0.8; ctx.lineJoin="round";
      series.paths.forEach(path=>{
        ctx.beginPath(); let stt=false;
        for (let i=0;i<path.length;i++){
          const x = X(fcStart + i), y = Y(path[i]);
          if (!stt){ ctx.moveTo(x,y); stt=true; } else ctx.lineTo(x,y);
        }
        ctx.stroke();
      });
    }
  }
  // 历史：有真实日 K → 蜡烛图（OHLC）+ MA + 成交量；否则收盘价折线
  if (hasK){
    const cw = Math.max(1.2, Math.min(7, plotW/klineArr.length*0.6));
    klineArr.forEach((k,i)=>{
      const x = X(i), uc = k.close>=k.open, ccol = uc ? getCss("--green") : getCss("--red");
      ctx.strokeStyle = ccol; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, Y(k.high)); ctx.lineTo(x, Y(k.low)); ctx.stroke();   // 影线
      const yO=Y(k.open), yC=Y(k.close);
      ctx.fillStyle = ccol;
      ctx.fillRect(x-cw/2, Math.min(yO,yC), cw, Math.max(1, Math.abs(yO-yC)));            // 实体
    });
    // 移动平均线（仅画 detailMaSet 中选中的周期）
    const MA_COLORS = {5:getCss("--blue-bright"), 10:getCss("--pred-down"), 20:"#A855F7"};
    const closes = klineArr.map(k=>k.close);
    const drawMA=(n,color)=>{
      if (closes.length < n) return;
      ctx.beginPath(); let started=false;
      for (let i=n-1;i<closes.length;i++){
        const ma = closes.slice(i-n+1,i+1).reduce((a,b)=>a+b,0)/n;
        const x=X(i), y=Y(ma); if(!started){ctx.moveTo(x,y);started=true;} else ctx.lineTo(x,y);
      }
      ctx.strokeStyle=color; ctx.lineWidth=1.4; ctx.lineJoin="round"; ctx.stroke();
    };
    [5,10,20].forEach(n=>{ if (detailMaSet.has(n)) drawMA(n, MA_COLORS[n]); });
    // 成交量（底部独立区域，按涨跌着色、半透明）
    const maxV = Math.max(1, ...klineArr.map(k=>k.volume||0));
    klineArr.forEach((k,i)=>{
      const x=X(i), vh=(k.volume||0)/maxV*volH, ccol=k.close>=k.open?getCss("--green"):getCss("--red");
      ctx.fillStyle = hexA(ccol, 0.42);
      ctx.fillRect(x-cw/2, volTop+volH-vh, cw, vh);
    });
    // MA 图例（仅显示选中的周期，价格区左上角）
    ctx.font="9px sans-serif"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    const leg = [5,10,20].filter(n=>detailMaSet.has(n)).map(n=>["MA"+n, MA_COLORS[n]]);
    let lx=padL+3; const ly=padT+8;
    leg.forEach(([t,c])=>{ ctx.fillStyle=c; ctx.fillRect(lx,ly-7,9,2.5); ctx.fillStyle=getCss("--text-2"); ctx.fillText(t, lx+12, ly); lx+=46; });
  } else {
    ctx.beginPath(); let hs=false;
    series.hist.forEach((v,i)=>{ if (v==null||isNaN(v)) return; const x=X(i),y=Y(v); if(!hs){ctx.moveTo(x,y);hs=true;} else ctx.lineTo(x,y); });
    ctx.strokeStyle=col; ctx.lineWidth=2; ctx.lineJoin="round"; ctx.stroke();
  }
  // 预测虚线（按 fc 实际长度画全，允许超出历史范围）
  ctx.beginPath(); let ps=false;
  for (let i=0;i<(series.fc||[]).length;i++){ const v=series.fc[i]; if (v==null||isNaN(v)) continue; const x=X(i),y=Y(v); if(!ps){ctx.moveTo(x,y);ps=true;} else ctx.lineTo(x,y); }
  ctx.strokeStyle=predCol; ctx.lineWidth=2; ctx.setLineDash([6,5]); ctx.stroke(); ctx.setLineDash([]);
  // 底部日期轴（真实日 K 时显示 MM-DD）
  if (klineArr){
    ctx.fillStyle=getCss("--text-2"); ctx.font="9px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    [0, Math.floor((klineArr.length-1)/2), klineArr.length-1].forEach(i=>{
      const d = (klineArr[i].date||"").slice(5);
      if (d) ctx.fillText(d, X(i), h-6);
    });
  }
  // 右轴价
  ctx.fillStyle=getCss("--text-2"); ctx.font="10px sans-serif"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  [max, (max+min)/2, min].forEach(v=>ctx.fillText("$"+v.toFixed(2), padL+plotW+4, Y(v)+3));
  // 记录几何，供十字光标定位（x 中心数组 + 价格区 Y 映射）
  const xsLen = hasK ? klineArr.length : series.hist.length;
  _chartGeom = {
    xs: Array.from({length: xsLen}, (_,i)=>X(i)),
    priceTop: padT, priceH, min, S, hasK, kline: klineArr,
    volTop, volH, plotW, padL, plotBottom: h-padB
  };
}
// —— K线/走势图缓动过渡：新旧 series 逐点插值，曲线平滑移动到新形态 ——
let _chartAnim = null, _chartCurrent = null;
let _lastSeries = null;          // 最近一次绘制的 series（十字光标重绘基准）
let _chartGeom = null;           // 图表几何：蜡烛/走势 x 中心、价格 Y 映射、kline 数组
let _hover = null;               // 十字光标状态 {i, x, y}
let _hoverRaf = 0;

// —— 十字光标 + 悬浮读数（鼠标悬停 / 触摸拖动）——
function chartGeomCtx(){
  const cv = $("#chart-canvas");
  const dpr = window.devicePixelRatio || 1;
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr,0,0,dpr,0,0);
  return ctx;
}
function nearestIndex(px){
  if (!_chartGeom) return -1;
  const xs = _chartGeom.xs; let best=0, bd=1e9;
  for (let i=0;i<xs.length;i++){ const d=Math.abs(xs[i]-px); if (d<bd){ bd=d; best=i; } }
  return best;
}
function updateChartTip(i, g){
  const tip = $("#chart-tip"); if (!tip) return;
  const wrap = $("#chart-canvas").parentElement;
  if (g.hasK && g.kline && g.kline[i]){
    const k = g.kline[i];
    const chg = k.close - k.open; const pct = k.open ? chg/k.open*100 : 0;
    const up = chg>=0; const ccls = up ? "up" : "down";
    tip.innerHTML = `<div class="ctip-h ${ccls}">${k.date||""}</div>`+
      `<div class="ctip-row"><span>开</span><b>$${k.open.toFixed(2)}</b></div>`+
      `<div class="ctip-row"><span>高</span><b>$${k.high.toFixed(2)}</b></div>`+
      `<div class="ctip-row"><span>低</span><b>$${k.low.toFixed(2)}</b></div>`+
      `<div class="ctip-row"><span>收</span><b>$${k.close.toFixed(2)}</b></div>`+
      `<div class="ctip-row"><span>量</span><b>${fmtVol(k.volume)}</b></div>`+
      `<div class="ctip-row"><span>涨跌</span><b class="${ccls}">${up?"+":""}${pct.toFixed(2)}%</b></div>`;
  } else {
    const series = _lastSeries; const v = series && series.hist ? series.hist[i] : null;
    tip.innerHTML = `<div class="ctip-h">第 ${i+1} 点</div>`+
      `<div class="ctip-row"><span>价</span><b>$${v!=null?v.toFixed(2):"—"}</b></div>`;
  }
  tip.style.display = "block";
  const wrapRect = wrap.getBoundingClientRect();
  const x = g.xs[i];
  let left = x + 12; if (left + 140 > wrapRect.width) left = x - 12 - 140;
  if (left < 4) left = 4;
  tip.style.left = left + "px"; tip.style.top = "10px";
}
function drawCrosshair(){
  if (!_lastSeries) return;
  drawSeries(_lastSeries);                 // 重绘底层（清掉上一次光标）
  if (!_hover || !_chartGeom) return;
  const g = _chartGeom; const ctx = chartGeomCtx(); const i = _hover.i; const x = g.xs[i];
  ctx.strokeStyle = getCss("--text-2"); ctx.lineWidth = 1; ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(x, g.priceTop); ctx.lineTo(x, g.plotBottom); ctx.stroke();
  ctx.setLineDash([]);
  const y = Math.max(g.priceTop, Math.min(g.plotBottom, _hover.y));
  ctx.beginPath(); ctx.moveTo(g.padL, y); ctx.lineTo(g.padL+g.plotW, y); ctx.stroke();
  if (g.hasK && g.kline && g.kline[i]){
    const k=g.kline[i]; const ccol=k.close>=k.open?getCss("--green"):getCss("--red");
    ctx.fillStyle=ccol; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI*2); ctx.fill();
  }
  const price = g.min + (1 - (y-g.priceTop)/g.priceH) * g.S;
  const lbl = "$"+price.toFixed(2);
  ctx.font="10px sans-serif"; ctx.textAlign="left"; ctx.textBaseline="middle";
  const lw = ctx.measureText(lbl).width + 10;
  ctx.fillStyle = getCss("--text"); ctx.globalAlpha=.92; ctx.fillRect(g.padL+g.plotW+2, y-8, lw, 16); ctx.globalAlpha=1;
  ctx.fillStyle = getCss("--bg"); ctx.fillText(lbl, g.padL+g.plotW+7, y);
  updateChartTip(i, g);
}
function hideChartTip(){
  const tip=$("#chart-tip"); if (tip) tip.style.display="none";
  _hover=null; if (_lastSeries) drawSeries(_lastSeries);
}
function bindChartHover(){
  const cv = $("#chart-canvas"); if (!cv || cv._hoverBound) return; cv._hoverBound = true;
  const loc = (e,key) => { const r=cv.getBoundingClientRect(); const cx = (e.touches&&e.touches[0])?e.touches[0].clientX:e.clientX; const cy = (e.touches&&e.touches[0])?e.touches[0].clientY:e.clientY; return key==="x"? cx-r.left : cy-r.top; };
  const onMove = e => {
    if (!_chartGeom) return;
    const px = loc(e,"x"), py = loc(e,"y");
    if (px < _chartGeom.padL-2 || px > _chartGeom.padL+_chartGeom.plotW+2){ if (_hover) hideChartTip(); return; }
    const i = nearestIndex(px); if (i<0) return;
    _hover = { i, x:px, y:py };
    if (_hoverRaf) return;
    _hoverRaf = requestAnimationFrame(()=>{ _hoverRaf=0; drawCrosshair(); });
  };
  cv.addEventListener("pointermove", onMove);
  cv.addEventListener("pointerdown", onMove);
  cv.addEventListener("pointerleave", ()=>{ if (_hoverRaf){cancelAnimationFrame(_hoverRaf);_hoverRaf=0;} hideChartTip(); });
}

// —— 图表 Tab 滑动指示条 ——
function moveCtInd(){
  const tabs = $("#chart-tabs"); if (!tabs) return;
  const a = tabs.querySelector(".ct.active"); const ind = $("#ct-ind");
  if (!a || !ind) return;
  ind.style.width = a.offsetWidth + "px";
  ind.style.transform = "translateX(" + a.offsetLeft + "px)";
}

// —— 轻提示（操作反馈）——
function toast(msg, type){
  const screen = $(".screen") || document.body;
  let wrap = $("#toast-wrap");
  if (!wrap){ wrap = document.createElement("div"); wrap.id="toast-wrap"; wrap.className="toast-wrap"; screen.appendChild(wrap); }
  const el = document.createElement("div");
  el.className = "toast" + (type ? " "+type : "");
  el.textContent = msg;
  wrap.appendChild(el);
  requestAnimationFrame(()=>{ el.classList.add("show"); });
  setTimeout(()=>{ el.classList.remove("show"); setTimeout(()=>{ el.remove(); }, 260); }, 1700);
}
function easeOutCubic(t){ return 1 - Math.pow(1-t, 3); }
function interpSeries(from, to, t){
  const mk = (a, b) => {
    a = a||[]; b = b||[];
    const out = new Array(b.length);
    for (let i=0;i<b.length;i++){
      const av = i<a.length ? a[i] : null;
      const bv = b[i];
      if (bv==null) out[i] = null;                              // 目标无点：直接消失（长度随目标截断）
      else if (av==null||isNaN(av)) out[i] = bv*t;              // 目标新点：从 0 生长
      else out[i] = av + (bv-av)*t;                             // 两端有值：缓动插值
    }
    return out;
  };
  return { hist: mk(from.hist, to.hist), fc: mk(from.fc, to.fc),
           upper: mk(from.upper, to.upper), lower: mk(from.lower, to.lower),
           bias: to.bias, kline: to.kline, paths: to.paths };
}
function tweenChart(series){
  const from = _chartCurrent || series;
  if (typeof requestAnimationFrame !== "function"){ _chartCurrent = series; drawSeries(series); return; }
  const dur = 320, start = (performance && performance.now) ? performance.now() : Date.now();
  if (_chartAnim) cancelAnimationFrame(_chartAnim);
  const step = (now)=>{
    const t = Math.min(1, ((now!=null ? now : Date.now()) - start) / dur);
    const e = easeOutCubic(t);
    _chartCurrent = interpSeries(from, series, e);
    drawSeries(_chartCurrent);
    if (t < 1) _chartAnim = requestAnimationFrame(step);
    else _chartAnim = null;
  };
  _chartAnim = requestAnimationFrame(step);
}
function drawLive(r){
  tweenChart({ hist:r.hist, fc:r.hist.map(()=>null), upper:r.hist.map(()=>null),
               lower:r.hist.map(()=>null), kline:r.kline });
}
async function loadAndDraw(type){
  if (!detailTicker) return;
  const s = STOCK_BY_TICKER[detailTicker], r = rt[detailTicker];
  $$("#chart-tabs .ct").forEach(b=>b.classList.toggle("active", b.dataset.type===type));
  detailType = type;
  moveCtInd();
  if (type==="live"){ drawLive(r); return; }
  const horizon = parseInt(type,10);
  const fc = forecast(s, r, horizon, MC_DETAIL_PATHS);
  tweenChart({ hist:fc.histSeries, fc:fc.fcSeries, upper:fc.upper, lower:fc.lower,
               bias:fc.bias, kline:r.kline, paths:fc.paths });
}
function renderForecastCards(){
  if (!detailTicker) return;
  const s = STOCK_BY_TICKER[detailTicker], r = rt[detailTicker];
  const fc = forecast(s, r, 14, MC_DETAIL_PATHS);
  const biasTxt = fc.bias==="bullish" ? "看涨延续" : "看跌承压";
  const biasCls = fc.bias==="bullish" ? "pred-up" : "pred-down";
  const sig = fc.signals;
  const maCls = sig.ma5>=sig.ma20 ? "pred-up" : "pred-down";
  const rsiCls = sig.rsi>=70 ? "pred-down" : (sig.rsi<=30 ? "pred-up" : "");
  const momCls = sig.mom>=0 ? "pred-up" : "pred-down";
  const reso = sig.agreement>0 ? "趋势技术共振" : "趋势技术背离";
  $("#d-forecast").innerHTML = `
    <div class="dm" style="grid-column:1/-1;display:flex;gap:12px;align-items:center">
      <div style="flex:1">
        <div class="dm-l">模型方向判断</div>
        <div class="dm-v ${biasCls}" style="font-size:16px">${biasTxt}</div>
      </div>
      <div style="text-align:right">
        <div class="dm-l">14日目标价位</div>
        <div class="dm-v" style="font-size:18px">$${fc.target.toFixed(2)}</div>
      </div>
    </div>
    <div class="dm"><div class="dm-l">14日预期空间</div><div class="dm-v ${fc.gain>=0?'pred-up':'pred-down'}">${fc.gain>=0?'+':''}${fc.gain.toFixed(1)}%</div></div>
    <div class="dm"><div class="dm-l">模型置信度</div><div class="dm-v">${fc.confidence}%</div></div>
    <div class="dm"><div class="dm-l">看多概率</div><div class="dm-v ${fc.upProb>=0.5?'pred-up':'pred-down'}">${Math.round(fc.upProb*100)}%</div></div>
    <div class="dm"><div class="dm-l">当前价</div><div class="dm-v">$${r.price.toFixed(2)}</div></div>
    <div class="dm"><div class="dm-l">日波动率</div><div class="dm-v">${s.volatility.toFixed(1)}%</div></div>
    <div class="dm"><div class="dm-l">板块</div><div class="dm-v" style="font-size:12px">${s.group}</div></div>
    <div class="dm" style="grid-column:1/-1">
      <div class="dm-l">技术面信号（增强判断）</div>
      <div class="sig-row">
        <span class="sig-chip">动量 <b class="${momCls}">${(sig.mom*100).toFixed(2)}%</b></span>
        <span class="sig-chip">RSI(14) <b class="${rsiCls}">${sig.rsi.toFixed(1)}</b></span>
        <span class="sig-chip">MA5/20 <b class="${maCls}">${sig.ma5>=sig.ma20?"金叉":"死叉"}</b></span>
        <span class="sig-chip">${reso}</span>
      </div>
    </div>`;
}
function renderDetailQuote(s, r){
  const chg = dayChg(s,r), up=chg>=0, cls=up?"up":"down", sign=up?"+":"";
  const p=$("#d-price"); if(p){ tweenNumber(p, r.price, v=>"$"+v.toFixed(2)); p.className="d-price "+cls; }
  const c=$("#d-change"); if(c){ tweenNumber(c, r.price, v=>`${sign}${v.toFixed(2)}  ${sign}${chg.toFixed(2)}%`); c.className="d-change "+cls; }
  if($("#d-open"))   $("#d-open").textContent="$"+r.open.toFixed(2);
  if($("#d-prev"))   $("#d-prev").textContent="$"+r.prevClose.toFixed(2);
  if($("#d-high"))   $("#d-high").textContent="$"+r.high.toFixed(2);
  if($("#d-low"))    $("#d-low").textContent="$"+r.low.toFixed(2);
  if($("#d-vol"))    $("#d-vol").textContent=fmtVol(r.volume);
}
function openDetail(ticker){
  const s = STOCK_BY_TICKER[ticker]; if (!s) return;
  detailTicker = ticker;
  $("#d-name").textContent = s.name;
  $("#d-code").textContent = ticker + " · " + s.sector;
  renderDetailQuote(s, rt[ticker]);
  $("#page-detail").classList.add("open");
  loadAndDraw("live");
  renderForecastCards();
  // 收藏按钮状态
  $("#detail-fav").classList.toggle("on", isFav(ticker));
  // 提醒按钮状态
  const alerts = loadAlerts();
  $("#detail-alert").classList.toggle("on", !!(alerts[ticker] && (alerts[ticker].above!=null || alerts[ticker].below!=null)));
  trackView(ticker);
  // 异步拉真实日 K，成功后用真实蜡烛/收盘序列重绘（历史锁定，不再合成）
  loadKline(ticker, detailKlineDays).then(ok=>{
    if (!ok || detailTicker!==ticker) return;
    applyKlinePeriod(ticker);
    renderDetailQuote(s, rt[ticker]);
    loadAndDraw(detailType);
    renderForecastCards();
  });
}

/* ============ 通知 / 价格提醒 ============ */
function loadAlerts(){
  try { const a = JSON.parse(localStorage.getItem("stockscope_alerts")); if (a && typeof a==="object") return a; } catch(e){}
  return {};
}
function saveAlerts(a){ try { localStorage.setItem("stockscope_alerts", JSON.stringify(a)); } catch(e){} }
function notifyOn(){ try { return localStorage.getItem("stockscope_notify_on") !== "false"; } catch(e){ return true; } }
function loadNotifs(){
  try { const n = JSON.parse(localStorage.getItem("stockscope_notifications")); if (Array.isArray(n)) return n; } catch(e){}
  return [];
}
function saveNotifs(n){ try { localStorage.setItem("stockscope_notifications", JSON.stringify(n)); } catch(e){} }
function pushNotif(n){
  const list = loadNotifs();
  list.unshift(Object.assign({ id:Date.now()+"_"+Math.random().toString(36).slice(2), time:Date.now(), unread:true }, n));
  if (list.length>50) list.length=50;
  saveNotifs(list);
  updateBadge();
}
function updateBadge(){
  const n = loadNotifs().filter(x=>x.unread).length;
  const b = $("#notify-badge");
  if (n>0){ b.hidden=false; b.textContent = n>99?"99+":n; } else b.hidden=true;
}
function checkAlerts(){
  if (!notifyOn()) return;
  const alerts = loadAlerts();
  let changed=false;
  US_STOCKS.forEach(s=>{
    const a = alerts[s.ticker]; if (!a) return;
    const r = rt[s.ticker]; if (!r) return;
    let hit=null;
    if (a.above!=null && r.price >= a.above) hit = { dir:"above", val:a.above };
    else if (a.below!=null && r.price <= a.below) hit = { dir:"below", val:a.below };
    if (hit){
      pushNotif({ type:"price", ticker:s.ticker, name:s.name,
        title:`${s.ticker} 价格提醒`,
        body:`当前 $${r.price.toFixed(2)} 已${hit.dir==="above"?"突破":"跌破"} $${hit.val}` });
      delete alerts[s.ticker]; changed=true;
    }
  });
  if (changed){ saveAlerts(alerts); }
}
function renderNotify(){
  const list = loadNotifs();
  const body = $("#notify-body");
  if (!list.length){ body.innerHTML = `<div class="empty-tip">${T("notify.empty")}</div>`; return; }
  body.innerHTML = `<div class="notify-sec"><h4>价格提醒 <span class="act" id="notify-clear-all">全部已读</span></h4>` +
    list.map(n=>`<div class="n-item ${n.unread?'unread':''}" data-id="${n.id}">
      <div class="n-ic price-up">$</div>
      <div class="n-main"><div class="n-title">${n.title}</div><div class="n-body">${n.body}</div>
      <div class="n-time">${new Date(n.time).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})}</div></div></div>`).join("") + `</div>`;
  body.querySelectorAll(".n-item").forEach(el=>el.addEventListener("click",()=>{
    const id=el.dataset.id; const l=loadNotifs(); const it=l.find(x=>x.id===id); if(it) it.unread=false; saveNotifs(l); updateBadge(); renderNotify();
  }));
  const ca=$("#notify-clear-all"); if(ca) ca.addEventListener("click",()=>{ const l=loadNotifs(); l.forEach(x=>x.unread=false); saveNotifs(l); updateBadge(); renderNotify(); });
}
function openAlert(t){
  const s=STOCK_BY_TICKER[t]; const a=loadAlerts()[t]||{};
  $("#alert-title").textContent = "价格提醒 · "+t;
  $("#alert-stock").textContent = s.name; $("#alert-stock").dataset.ticker=t;
  $("#alert-above").value = a.above!=null?a.above:"";
  $("#alert-below").value = a.below!=null?a.below:"";
  $("#alert-msg").textContent="";
  openMask("alert-mask");
}

/* ============ 账户（后端 JWT 鉴权，镜像 JR Stock Terminal） ============ */
const AVATARS = ["🦊","🐼","🚀","🌟","🐱","🐶","🦄","🍎","⚡","🔥","💡","🐳"];
function loadUser(){ try { const u=JSON.parse(localStorage.getItem("stockscope_user")); if(u&&u.name&&u.token) return u; } catch(e){} return null; }
function saveUser(u){ try { localStorage.setItem("stockscope_user", JSON.stringify(u)); } catch(e){} }
function renderProfile(){
  const u = loadUser();
  if (u){
    $("#profile-name").firstChild.textContent = u.name + " ";
    $("#profile-meta").textContent = T("profile.loggedIn");
    $("#profile-avatar").textContent = u.avatar || "😀";
    $("#account-btn").hidden=false; $("#logout-btn").hidden=false;
  } else {
    $("#profile-name").firstChild.textContent = T("profile.guest") + " ";
    $("#profile-meta").textContent = T("profile.notLogin");
    $("#profile-avatar").textContent = "?";
    $("#account-btn").hidden=true; $("#logout-btn").hidden=true;
  }
}
function buildAuth(){
  const body=$("#auth-body");
  body.innerHTML = `
    <div class="auth-tabs"><button class="auth-tab active" data-mode="login">${T("auth.login")}</button><button class="auth-tab" data-mode="register">${T("auth.register")}</button></div>
    <div class="auth-form">
      <input class="auth-input" id="auth-user" placeholder="${T("auth.userPh")}" maxlength="20" />
      <input class="auth-input" id="auth-email" placeholder="${T("auth.emailPh")}" maxlength="60" />
      <input class="auth-input" id="auth-pass" type="password" placeholder="${T("auth.passPh")}" maxlength="30" />
      <div class="auth-msg" id="auth-msg"></div>
      <button class="auth-btn" id="auth-submit">${T("auth.login")}</button>
    </div>`;
  let mode="login";
  body.querySelectorAll(".auth-tab").forEach(t=>t.addEventListener("click",()=>{
    mode=t.dataset.mode; body.querySelectorAll(".auth-tab").forEach(x=>x.classList.toggle("active",x===t));
    $("#auth-email").style.display = mode==="register" ? "block" : "none";
    $("#auth-submit").textContent = mode==="login"?T("auth.login"):T("auth.register"); $("#auth-msg").textContent="";
  }));
  $("#auth-email").style.display="none";
  $("#auth-submit").addEventListener("click", async ()=>{
    const name=$("#auth-user").value.trim(), pass=$("#auth-pass").value, email=$("#auth-email").value.trim();
    if (!name||!pass){ $("#auth-msg").textContent=T("auth.fill"); return; }
    if (mode==="register" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ $("#auth-msg").textContent=T("auth.badEmail"); return; }
    $("#auth-submit").disabled=true; $("#auth-msg").textContent=T("auth.proc");
    try {
      const url = mode==="login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode==="login" ? { identifier:name, password:pass } : { username:name, email, password:pass };
      const r = await fetch(API_BASE + url, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      const d = await r.json().catch(()=>({}));
      if (!r.ok){ $("#auth-msg").textContent = d.message || T("auth.fail"); $("#auth-submit").disabled=false; return; }
      const u = { name: d.user.username, token: d.token, avatar: AVATARS[name.length%AVATARS.length] };
      saveUser(u); renderProfile(); await loadFav(); renderFav(); closeMask("auth-mask"); toast(mode==="login"?"登录成功":"注册成功");
    } catch(e){
      $("#auth-msg").textContent=T("auth.noServer"); $("#auth-submit").disabled=false;
    }
  });
}

/* ============ 弹窗 / Tab / 深浅 ============ */
function openMask(id){ $("#"+id).classList.add("open"); }
function closeMask(id){ $("#"+id).classList.remove("open"); }
function switchTab(target){
  $$(".page").forEach(p=>p.hidden=true);
  $("#page-"+target).hidden=false;
  $$(".tab").forEach(t=>t.classList.toggle("active", t.dataset.target===target));
  $("#pages").scrollTop=0;
}
function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  const tg=$("#theme-toggle"); if(tg) tg.checked = theme==="dark";
  try { localStorage.setItem("stock-theme", theme); } catch(e){}
}
function toggleTheme(){ applyTheme(document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark"); }

/* ============ 收藏：管理态 + 左滑删除 ============ */
let favManage=false; const favSel=new Set();
function setFavManage(on){
  favManage=on; favSel.clear();
  $("#fav-manage").textContent = on?T("fav.done"):T("fav.manage");
  $("#fav-action-bar").hidden = !on;
  renderFav();
}
function setupFav(){
  $("#fav-manage").addEventListener("click", ()=> setFavManage(!favManage));
  $("#fav-cancel").addEventListener("click", ()=> setFavManage(false));
  $("#fav-select-all").addEventListener("click", ()=>{
    const all = favList.slice();
    if (favSel.size === all.length) favSel.clear(); else all.forEach(t=>favSel.add(t));
    $("#fav-sel-count").textContent = favSel.size;
    renderFav();
  });
  $("#fav-del").addEventListener("click", ()=>{
    const removed = favList.filter(t=>favSel.has(t));
    favList = favList.filter(t=>!favSel.has(t));
    cacheFav(); favSel.clear(); $("#fav-sel-count").textContent=0;
    removed.forEach(t=>remoteToggle(t));   // 同步后端
    if (!favList.length) setFavManage(false); else renderFav();
  });
  const ul=$("#fav-list");
  // 左滑删除
  let sx=0, sy=0, curLi=null, moved=false;
  ul.addEventListener("pointerdown", e=>{
    const li=e.target.closest(".fav-row"); if(!li||favManage) return;
    curLi=li; sx=e.clientX; sy=e.clientY; moved=false; li.querySelector(".fav-row-inner").style.transition="none";
  });
  ul.addEventListener("pointermove", e=>{
    if(!curLi) return; const dx=e.clientX-sx, dy=e.clientY-sy;
    if (Math.abs(dx)>8) moved=true;
    if (Math.abs(dx)>Math.abs(dy) && dx<0){
      const t=Math.max(-76, dx); curLi.querySelector(".fav-row-inner").style.transform=`translateX(${t}px)`;
    }
  });
  const end=()=>{
    if(!curLi) return;
    const inner=curLi.querySelector(".fav-row-inner"); inner.style.transition="transform .2s ease";
    const m=inner.style.transform.match(/-?\d+\.?\d*/);
    if (m && parseFloat(m[0]) < -38){
      inner.style.transform="translateX(-76px)";
      curLi.querySelector(".fav-del-btn").onclick=()=>{
        const t=curLi.dataset.ticker; favList=favList.filter(x=>x!==t); cacheFav(); remoteToggle(t); renderFav();
      };
    } else { inner.style.transform="translateX(0)"; }
    curLi=null;
  };
  ul.addEventListener("pointerup", end);
  ul.addEventListener("pointercancel", end);
  // 管理态点击勾选
  ul.addEventListener("click", e=>{
    if (!favManage) return;
    const li=e.target.closest(".fav-row"); if(!li) return;
    const t=li.dataset.ticker;
    if (favSel.has(t)) favSel.delete(t); else favSel.add(t);
    $("#fav-sel-count").textContent=favSel.size;
    renderFav();
  });
}

/* ============ 初始化 ============ */
function init(){
  // 初始化运行时
  US_STOCKS.forEach(s=>{ rt[s.ticker] = seedStock(s); });
  loadFav();
  ensureVisitor();

  // 首页
  renderHome();
  // 分析
  renderAnalyze();
  $("#analyze-date").textContent = new Date().toLocaleDateString("zh-CN",{month:"long",day:"numeric",weekday:"long"});
  // 精选
  renderFeatured("all");
  // 收藏
  renderFav();
  // 通知
  updateBadge();

  // 开屏
  setTimeout(()=>$("#splash").classList.add("hide"), 1500);

  // Tab
  $$(".tab").forEach(t=>t.addEventListener("click", ()=>switchTab(t.dataset.target)));

  // 深浅
  let saved="light"; try { saved=localStorage.getItem("stock-theme")||"light"; } catch(e){}
  applyTheme(saved);
  $("#theme-toggle").addEventListener("change", toggleTheme);

  // 语言
  try { LANG = localStorage.getItem("stock-lang") || "zh"; } catch(e){}
  applyLang();
  const langSel = $("#lang-select");
  if (langSel){
    langSel.value = LANG;
    langSel.addEventListener("change", ()=>{
      LANG = langSel.value;
      try { localStorage.setItem("stock-lang", LANG); } catch(e){}
      applyLang();
    });
  }

  // 精选板块筛选
  $$("#chips .chip").forEach(c=>c.addEventListener("click", ()=>{
    $$("#chips .chip").forEach(x=>x.classList.remove("active")); c.classList.add("active");
    renderFeatured(c.dataset.sector);
  }));
  $("#refresh-btn").addEventListener("click", ()=>{
    const cur=$("#chips .chip.active"); renderFeatured(cur?cur.dataset.sector:"all");
    const ic=$("#refresh-btn svg"); ic.style.transition="transform .5s"; ic.style.transform="rotate(360deg)";
    setTimeout(()=>ic.style.transform="rotate(0deg)",500);
  });

  setupSearch();
  setupFav();

  // 详情页
  $("#detail-back").addEventListener("click", ()=>$("#page-detail").classList.remove("open"));
  $$("#chart-tabs .ct").forEach(b=>b.addEventListener("click", ()=>loadAndDraw(b.dataset.type)));

  // K线周期切换（1月 / 3月 / 1年）：重新拉取对应天数的真实日 K 并重绘
  $$("#kline-period .seg-btn").forEach(b=>b.addEventListener("click", async ()=>{
    const days = parseInt(b.dataset.days,10);
    if (!detailTicker || days===detailKlineDays) return;
    detailKlineDays = days;
    $$("#kline-period .seg-btn").forEach(x=>x.classList.toggle("active", x===b));
    const t = detailTicker;
    if (!(rt[t] && rt[t].klineByDays && rt[t].klineByDays[days])){
      await loadKline(t, days);
    }
    applyKlinePeriod(t);
    loadAndDraw(detailType);
    renderForecastCards();
    toast("已切换至 " + b.textContent);
  }));
  // 均线周期切换（MA5 / MA10 / MA20 可独立开关）
  $$("#ma-seg .seg-btn").forEach(b=>b.addEventListener("click", ()=>{
    const ma = parseInt(b.dataset.ma,10);
    if (detailMaSet.has(ma)){ detailMaSet.delete(ma); b.classList.remove("active"); }
    else { detailMaSet.add(ma); b.classList.add("active"); }
    if (detailTicker) loadAndDraw(detailType);
  }));
  bindChartHover();
  document.addEventListener("click", e=>{
    if (favManage) return;
    const li=e.target.closest(".stock-item, .fc-card, .pred-row, .fav-row");
    if (li && li.dataset.ticker) openDetail(li.dataset.ticker);
  });
  $("#detail-fav").addEventListener("click", ()=>{
    if (!detailTicker) return;
    const u = loadUser();
    if (!u || !u.token){ openMask("auth-mask"); return; }
    toggleFav(detailTicker).then(()=>{
      const on = isFav(detailTicker);
      $("#detail-fav").classList.toggle("on", on); renderFav();
      toast(on ? "已加入自选" : "已移除自选");
    });
  });
  $("#detail-alert").addEventListener("click", ()=>{
    if (!detailTicker) return; openAlert(detailTicker);
  });
  window.addEventListener("resize", ()=>{ if (detailTicker && $("#page-detail").classList.contains("open")) loadAndDraw(detailType); });

  // 通知中心
  $("#notify-bell").addEventListener("click", ()=>{ renderNotify(); openMask("notify-mask"); });
  $$("#notify-mask .auth-close").forEach(b=>b.addEventListener("click", ()=>closeMask("notify-mask")));

  // 价格提醒弹窗
  $("#alert-save").addEventListener("click", ()=>{
    const t=$("#alert-stock").dataset.ticker; if(!t) return;
    const above=$("#alert-above").value, below=$("#alert-below").value;
    const alerts=loadAlerts();
    alerts[t]={ above: above?parseFloat(above):null, below: below?parseFloat(below):null };
    if (alerts[t].above==null && alerts[t].below==null) delete alerts[t];
    saveAlerts(alerts);
    $("#alert-msg").textContent="已保存"; toast("价格提醒已保存"); setTimeout(()=>closeMask("alert-mask"), 600);
  });
  $$("#alert-mask .auth-close").forEach(b=>b.addEventListener("click", ()=>closeMask("alert-mask")));

  // 设置 / 关于 / 通用
  $("#row-notify").addEventListener("click", ()=>{ renderNotify(); openMask("notify-mask"); });
  $("#row-about").addEventListener("click", ()=>openMask("about-mask"));
  $("#row-general").addEventListener("click", ()=>openMask("general-mask"));
  $$("#general-mask .auth-close").forEach(b=>b.addEventListener("click", ()=>closeMask("general-mask")));
  $$("#about-mask .auth-close").forEach(b=>b.addEventListener("click", ()=>closeMask("about-mask")));
  $("#gen-clear").addEventListener("click", ()=>{
    try { localStorage.removeItem("us-favorites"); localStorage.removeItem("stockscope_alerts"); } catch(e){}
    renderFav(); closeMask("general-mask"); toast("本地缓存已清除");
  });
  $("#gen-about").addEventListener("click", ()=>openMask("about-mask"));

  // 账户（本地）
  renderProfile();
  buildAuth();
  $("#profile-head").addEventListener("click", ()=>openMask("auth-mask"));
  $$("#auth-mask .auth-close").forEach(b=>b.addEventListener("click", ()=>closeMask("auth-mask")));
  $("#account-btn").addEventListener("click", ()=>openAccount());
  $("#logout-btn").addEventListener("click", ()=>{ localStorage.removeItem("stockscope_user"); favList=[]; renderProfile(); renderFav(); });
  $$("#account-mask .auth-close").forEach(b=>b.addEventListener("click", ()=>closeMask("account-mask")));

  // 价格提醒编辑（openAlert 已提为顶层函数）
}
function openAccount(){
  const u=loadUser()||{name:"",avatar:"😀"};
  $("#acc-avatar-prev").textContent=u.avatar||"😀";
  $("#acc-username").value=u.name||"";
  const grid=$("#avatar-grid"); grid.innerHTML=AVATARS.map(a=>`<div class="avatar-opt ${a===(u.avatar)?'selected':''}">${a}</div>`).join("");
  grid.querySelectorAll(".avatar-opt").forEach(o=>o.addEventListener("click",()=>{
    grid.querySelectorAll(".avatar-opt").forEach(x=>x.classList.remove("selected")); o.classList.add("selected");
    $("#acc-avatar-prev").textContent=o.textContent;
  }));
  $("#account-msg").textContent="";
  openMask("account-mask");
  $("#account-save").onclick=()=>{
    const name=$("#acc-username").value.trim();
    if(!name){ $("#account-msg").textContent="用户名不能为空"; return; }
    const cur=loadUser()||{}; cur.name=name; cur.avatar=$("#acc-avatar-prev").textContent;
    saveUser(cur); renderProfile(); closeMask("account-mask");
  };
}

// 实时循环：0.1s 基础节拍
//  - 合成态：开盘 0.1s 快跳 / 休市 2s
//  - 真实态 + 开盘：0.1s 微波动（围绕真实价均值回归），让价格“活”起来；真实价由 refreshReal 每 1s 校正
function throttle(key, ms){
  const now = Date.now();
  if (tickLoop._t[key]==null || now - tickLoop._t[key] >= ms){ tickLoop._t[key]=now; return true; }
  return false;
}
function wiggleReal(){
  US_STOCKS.forEach(s=>{
    const r = rt[s.ticker]; if (!r) return;
    const base = (r.realPrice!=null) ? r.realPrice : r.price;
    const pull  = (base - r.price) * 0.08;              // 向真实价回归
    const noise = (Math.random()-0.5) * base * 0.0008;  // ±0.04% 微扰
    r.price = Math.max(0.01, r.price + pull + noise);
    // 图表只动最新点（当前价在变），历史段保持锁定
    if (r.hist && r.hist.length && r.histLocked!==false) r.hist[r.hist.length-1] = r.price;
  });
  INDICES.forEach(ix=>{
    const base = (ix.realPrice!=null) ? ix.realPrice : ix.price;
    ix.price = Math.max(1, ix.price + (base-ix.price)*0.08 + (Math.random()-0.5)*ix.vol*0.05);
  });
}
function tickLoop(){
  const open = marketOpen();
  if (!USING_REAL){
    if (throttle("_synth", open ? TICK_OPEN_MS : TICK_CLOSED_MS)){
      US_STOCKS.forEach(s=>{ if (rt[s.ticker]) tickStock(s, rt[s.ticker]); });
      INDICES.forEach(ix=>{ ix.price = Math.max(1, ix.price + (Math.random()-0.5)*ix.vol*0.3); });
    }
  } else if (open){
    wiggleReal();
  } else {
    return; // 真实态 + 休市：价格静止，不更新
  }
  updateLive();                              // 0.1s 就地平滑更新（数字补间 + 迷你图）
  if (throttle("_struct", 4000)) renderActive();  // 4s 结构性刷新（列表重排 / 分析页仪表）
  if (detailTicker && $("#page-detail").classList.contains("open")){
    if (throttle("_detail", 400)){ renderForecastCards(); loadAndDraw(detailType); }
  }
  checkAlerts();
}
tickLoop._t = {};
function clockLoop(){
  const t = new Date().toLocaleTimeString("en-US",{ timeZone:"America/New_York", hour12:false });
  $("#est-clock").textContent = t + " EST";
  const open=marketOpen();
  const txt = open ? "美股交易中 · 实时行情" : (USING_REAL ? "美股休市 · 收盘数据" : "美股休市 · 演示数据");
  $("#market-status").textContent = txt;
  $("#market-status").style.color = open ? "var(--green)" : "var(--text-2)";
}

document.addEventListener("DOMContentLoaded", ()=>{
  init();
  clockLoop(); setInterval(clockLoop, 1000);
  setInterval(tickLoop, TICK_OPEN_MS);  // 0.1s 基础节拍
  startRealData();   // 尝试拉真实行情，失败则保持合成回退
});
