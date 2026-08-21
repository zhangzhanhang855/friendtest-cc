#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
StockScope 后端（Python 版，零依赖，纯标准库）
================================================
- 静态托管 ../stock-app（同端口，无 CORS 问题）
- 游客数据持久化（localStorage 中的 id ↔ 服务端游客档案）
- 各股票每日浏览次数统计（按服务器本地日期分桶）
- 首页「近期热门」直接读 /api/hot
- 管理面板 /manage（实时统计 + 热门排行 + 访客 + 清空）

接口（与 Node 版完全一致，前端无需改动）：
  POST /api/visitor   {id?}                       -> {id}
  POST /api/view      {code,name,secid,visitor}   -> {ok,count}
  GET  /api/hot?limit=8                           -> [{code,name,secid,count}]
  GET  /api/stats                                -> {visitors,todayViews,totalViews,todayStocks}
  GET  /api/visitors                              -> [{id,lastSeen,totalViews,stocks}]
  POST /api/clear      {scope:"today"|"all"}      -> {ok}

运行：python server.py    （PORT 默认 8080，可用环境变量 PORT 覆盖）
"""
import http.server
import json
import os
import sys
import threading
import time
import urllib.request
import hmac
import hashlib
import base64
import re
from datetime import datetime
from urllib.parse import urlparse, parse_qs, quote

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(BASE_DIR, "..", "stock-app"))
DATA_DIR = os.path.join(BASE_DIR, "data")
DATA_FILE = os.path.join(DATA_DIR, "store.json")
PORT = int(os.environ.get("PORT", "8080"))

MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
}

store_lock = threading.Lock()
_save_timer = None

# ---------------- 数据持久化 ----------------
def load_store():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"visitors": {}, "dailyViews": {}}

store = load_store()

def today_key():
    return datetime.now().strftime("%Y-%m-%d")

def today_bucket():
    k = today_key()
    if k not in store["dailyViews"]:
        store["dailyViews"][k] = {}
    return store["dailyViews"][k]

def persist():
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        tmp = DATA_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(store, f, ensure_ascii=False, indent=2)
        os.replace(tmp, DATA_FILE)
    except Exception as e:
        sys.stderr.write("保存数据失败: %s\n" % e)

def schedule_save():
    global _save_timer
    if _save_timer is not None:
        _save_timer.cancel()
    _save_timer = threading.Timer(0.3, persist)
    _save_timer.daemon = True
    _save_timer.start()

def gen_id():
    return "v_" + datetime.now().strftime("%Y%m%d%H%M%S") + os.urandom(4).hex()

def clamp(v, n):
    return v[:n] if isinstance(v, str) else None

# ---------------- API 业务 ----------------
def api_visitor(body):
    rid = clamp(body.get("id"), 64)
    vid = rid if (rid and rid.startswith("v_")) else gen_id()
    now = int(time.time() * 1000)
    with store_lock:
        if vid not in store["visitors"]:
            store["visitors"][vid] = {"id": vid, "createdAt": now, "lastSeen": now, "views": {}}
        else:
            store["visitors"][vid]["lastSeen"] = now
        schedule_save()
    return 200, {"id": vid}

def api_view(body):
    code = clamp(body.get("code"), 16)
    if not code:
        return 400, {"error": "code required"}
    name = clamp(body.get("name"), 32) or code
    secid = clamp(body.get("secid"), 16) or ""
    visitor = clamp(body.get("visitor"), 64)
    now = int(time.time() * 1000)
    with store_lock:
        b = today_bucket()
        rec = b.get(code) or {"code": code, "name": name, "secid": secid, "count": 0}
        rec["count"] = rec.get("count", 0) + 1
        rec["name"] = name
        if secid:
            rec["secid"] = secid
        b[code] = rec
        if visitor and visitor in store["visitors"]:
            v = store["visitors"][visitor]
            v["views"][code] = v["views"].get(code, 0) + 1
            v["lastSeen"] = now
        schedule_save()
    return 200, {"ok": True, "count": rec["count"]}

def api_hot(limit):
    limit = max(1, min(20, limit or 8))
    with store_lock:
        arr = list(store["dailyViews"].get(today_key(), {}).values())
    arr.sort(key=lambda x: x.get("count", 0), reverse=True)
    arr = [{"code": x["code"], "name": x["name"], "secid": x.get("secid", ""), "count": x["count"]}
           for x in arr[:limit]]
    return 200, arr

def api_stats():
    with store_lock:
        all_days = list(store["dailyViews"].values())
        total = sum(sum(x.get("count", 0) for x in day.values()) for day in all_days)
        today = store["dailyViews"].get(today_key(), {})
        today_views = sum(x.get("count", 0) for x in today.values())
        today_stocks = len(today)
        visitors = len(store["visitors"])
    return 200, {"visitors": visitors, "todayViews": today_views,
                 "totalViews": total, "todayStocks": today_stocks}

def api_visitors():
    with store_lock:
        items = []
        for v in store["visitors"].values():
            views = v.get("views", {})
            items.append({"id": v["id"], "lastSeen": v.get("lastSeen"),
                          "totalViews": sum(views.values()), "stocks": len(views)})
        items.sort(key=lambda x: x["lastSeen"] or 0, reverse=True)
    return 200, items

def api_clear(scope):
    with store_lock:
        if scope == "all":
            store["dailyViews"] = {}
            store["visitors"] = {}
        elif scope == "today":
            store["dailyViews"].pop(today_key(), None)
        schedule_save()
    return 200, {"ok": True}

# ---------------- 账户 / 自选（镜像 JR Stock Terminal 后端：JWT + 按用户存自选） ----------------
# 接口形态与朋友项目一致：POST /api/auth/register、POST /api/auth/login、
# GET /api/watchlist、POST /api/watchlist/toggle（后两者需 Authorization: Bearer <token>）
JWT_SECRET = os.environ.get("JWT_SECRET", "jr_super_secret_jwt_key_2026")
USERS_FILE = os.path.join(DATA_DIR, "users.json")

def load_users():
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

users_store = load_users()

def save_users():
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        tmp = USERS_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(users_store, f, ensure_ascii=False, indent=2)
        os.replace(tmp, USERS_FILE)
    except Exception as e:
        sys.stderr.write("保存用户失败: %s\n" % e)

def hash_pw(pw):
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt, 100000)
    return salt.hex() + ":" + dk.hex()

def verify_pw(pw, stored):
    try:
        salt, dk = stored.split(":")
        return hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), bytes.fromhex(salt), 100000).hex() == dk
    except Exception:
        return False

def make_token(username):
    payload = base64.urlsafe_b64encode(
        json.dumps({"u": username, "exp": int(time.time()) + 7 * 86400}).encode("utf-8")
    ).decode("ascii")
    sig = hmac.new(JWT_SECRET.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return payload + "." + sig

def verify_token(token):
    if not token:
        return None
    try:
        payload, sig = token.split(".")
        expect = hmac.new(JWT_SECRET.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expect, sig):
            return None
        data = json.loads(base64.urlsafe_b64decode(payload.encode("utf-8")).decode("utf-8"))
        if data.get("exp", 0) < int(time.time()):
            return None
        return data.get("u")
    except Exception:
        return None

def bearer_of(handler):
    h = handler.headers.get("Authorization", "")
    return h[7:].strip() if h.startswith("Bearer ") else ""

def api_register(body):
    username = clamp(body.get("username"), 20)
    email = clamp(body.get("email"), 60)
    password = body.get("password") or ""
    if not username or not email or len(password) < 6:
        return (400, {"message": "用户名/邮箱必填，密码至少 6 位"})
    with store_lock:
        if username in users_store:
            return (409, {"message": "用户名已存在"})
        if any(u.get("email") == email for u in users_store.values()):
            return (409, {"message": "邮箱已注册"})
        users_store[username] = {
            "username": username,
            "email": email,
            "password": hash_pw(password),
            "watchlist": [],
        }
        save_users()
    return (201, {"token": make_token(username),
                  "user": {"username": username, "watchlist": []}})

def api_login(body):
    identifier = clamp(body.get("identifier"), 60)
    password = body.get("password") or ""
    if not identifier or not password:
        return (400, {"message": "请输入账号和密码"})
    user = None
    with store_lock:
        for u in users_store.values():
            if u.get("username") == identifier or u.get("email") == identifier:
                user = u
                break
    if not user or not verify_pw(password, user["password"]):
        return (400, {"message": "账号或密码错误"})
    return (200, {"token": make_token(user["username"]),
                  "user": {"username": user["username"], "watchlist": user.get("watchlist", [])}})

def api_get_watchlist(handler):
    uname = verify_token(bearer_of(handler))
    if not uname:
        return (401, {"message": "请先登录"})
    with store_lock:
        u = users_store.get(uname)
        wl = u.get("watchlist", []) if u else []
    return (200, {"watchlist": wl})

def api_toggle_watchlist(handler, body):
    uname = verify_token(bearer_of(handler))
    if not uname:
        return (401, {"message": "请先登录"})
    ticker = (body.get("ticker") or "").strip().upper()
    if not ticker:
        return (400, {"message": "ticker 必填"})
    with store_lock:
        u = users_store.get(uname)
        if not u:
            return (404, {"message": "用户不存在"})
        wl = [t for t in u.get("watchlist", []) if isinstance(t, str)]
        if ticker in wl:
            wl = [t for t in wl if t != ticker]
            is_fav = False
        else:
            wl = [ticker] + wl
            is_fav = True
        u["watchlist"] = wl
        save_users()
    return (200, {"isFavorite": is_fav, "watchlist": wl})

# ---------------- HTTP 处理 ----------------
# ---------------- 真实行情代理（腾讯 gtimg 美股/指数，服务端转发绕开 CORS） ----------------
# 腾讯美股代码加 us 前缀：usTSLA；指数 usINX(标普500) / usIXIC(纳斯达克) / usDJI(道指) / usVIX(恐慌指数)
# 返回形如 v_usTSLA="200~中文名~代码~当前价~昨收~今开~...~时间~涨跌~涨跌幅~最高~最低~币种~..."
GTIMG_HOST = "https://qt.gtimg.cn/q="
GTIMG_HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://finance.qq.com/"}

def parse_gtimg(text):
    res = {}
    for line in text.replace("\r", "").split("\n"):
        line = line.strip()
        if not line.startswith("v_"):
            continue
        name, _, rest = line.partition("=")
        code = name[2:]                     # v_usTSLA -> usTSLA
        if code.startswith("us"):
            code = code[2:]                 # -> TSLA
        if not rest.startswith('"'):
            continue
        vals = rest.strip('"').split("~")
        if len(vals) < 35:
            continue
        try:
            price = float(vals[3]); prev = float(vals[4]); openp = float(vals[5])
            chg = float(vals[31]); pct = float(vals[32]); high = float(vals[33]); low = float(vals[34])
        except Exception:
            continue
        res[code] = {
            "ticker": code,
            "name": (vals[46] or vals[1]).strip(),
            "nameCn": vals[1].strip(),
            "price": price, "prevClose": prev, "open": openp,
            "change": chg, "changePct": pct, "high": high, "low": low,
            "time": vals[30], "currency": vals[35] if len(vals) > 35 else "",
        }
    return res

def fetch_gtimg(codes):
    """codes: ['TSLA','AAPL'] -> 请求 usTSLA,usAAPL -> 返回解析字典"""
    gt = ",".join("us" + c for c in codes)
    url = GTIMG_HOST + quote(gt)
    req = urllib.request.Request(url, headers=GTIMG_HEADERS)
    with urllib.request.urlopen(req, timeout=10) as r:
        text = r.read().decode("gbk", errors="ignore")
    return parse_gtimg(text)

def api_quotes(symbols):
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not syms:
        return (200, {"quotes": [], "source": "none"})
    try:
        parsed = fetch_gtimg(syms)
        out = [parsed[s] for s in syms if s in parsed]
        return (200, {"quotes": out, "source": "tencent", "count": len(out)})
    except Exception as e:
        return (200, {"quotes": [], "source": "error", "detail": str(e)})

def api_indices():
    mapping = {"sp": "INX", "ns": "IXIC", "dj": "DJI", "vx": "VIX"}
    try:
        parsed = fetch_gtimg([v for v in mapping.values()])
        out = {}
        rev = {v: k for k, v in mapping.items()}
        for code, q in parsed.items():
            key = rev.get(code)
            if key:
                out[key] = q
        return (200, {"indices": out, "source": "tencent"})
    except Exception as e:
        return (200, {"indices": {}, "source": "error", "detail": str(e)})

# ---------------- 美股日 K 线（新浪 usstock，统一代码不分交易所，urllib 可直连） ----------------
# JSONP: var _=([{d:'2026-08-18',o:'333.22',h:'340.53',l:'331.12',c:'336.87',v:'27994450',a:'...'},...]) 按日期升序
SINA_KLINE_URL = "https://stock.finance.sina.com.cn/usstock/api/jsonp.php/var%20_=/US_MinKService.getDailyK?symbol=__SYM__"

def fetch_sina_kline(ticker, days):
    url = SINA_KLINE_URL.replace("__SYM__", ticker.strip().upper())
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://finance.sina.com.cn/"})
    with urllib.request.urlopen(req, timeout=10) as r:
        raw = r.read().decode("utf-8", "ignore")
    m = re.search(r"var _=\((.*)\);?\s*$", raw, re.S)
    if not m:
        return []
    arr = json.loads(m.group(1))
    if not isinstance(arr, list):
        return []
    out = []
    for k in arr:
        try:
            out.append({"date": k.get("d"), "open": float(k.get("o")), "close": float(k.get("c")),
                        "high": float(k.get("h")), "low": float(k.get("l")), "volume": float(k.get("v") or 0)})
        except Exception:
            continue
    return out[-days:]   # 取最近 N 根（数据按日期升序）

def api_kline(symbol, days):
    sym = (symbol or "").strip().upper()
    if not sym:
        return (400, {"error": "symbol required"})
    days = max(10, min(250, days or 40))
    try:
        kl = fetch_sina_kline(sym, days)
        return (200, {"symbol": sym, "kline": kl, "source": "sina", "count": len(kl)})
    except Exception as e:
        return (200, {"kline": [], "source": "error", "detail": str(e)})


class Handler(http.server.BaseHTTPRequestHandler):
    server_version = "StockScopePy/1.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def _send_json(self, code, obj):
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def _send_html(self, html):
        data = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_static(self, pathname):
        p = decode_path(pathname).lstrip("/")
        if p in ("", "index.html"):
            p = "index.html"
        fp = os.path.normpath(os.path.join(ROOT, p))
        if not fp.startswith(ROOT):
            self.send_error(403, "forbidden")
            return
        try:
            with open(fp, "rb") as f:
                data = f.read()
        except Exception:
            self.send_error(404, "not found")
            return
        ext = os.path.splitext(fp)[1].lower()
        self.send_response(200)
        self.send_header("Content-Type", MIME.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/api/stats":
            return self._send_json(*api_stats())
        if u.path == "/api/hot":
            q = parse_qs(u.query)
            try:
                lim = int(q.get("limit", ["8"])[0])
            except Exception:
                lim = 8
            return self._send_json(*api_hot(lim))
        if u.path == "/api/visitors":
            return self._send_json(*api_visitors())
        if u.path == "/api/quotes":
            q = parse_qs(u.query)
            return self._send_json(*api_quotes(q.get("symbols", [""])[0]))
        if u.path == "/api/indices":
            return self._send_json(*api_indices())
        if u.path == "/api/kline":
            q = parse_qs(u.query)
            try:
                days = int(q.get("days", ["40"])[0])
            except Exception:
                days = 40
            return self._send_json(*api_kline(q.get("symbol", [""])[0], days))
        if u.path == "/api/watchlist":
            return self._send_json(*api_get_watchlist(self))
        if u.path == "/manage":
            return self._send_html(MANAGE_HTML)
        return self.serve_static(u.path)

    def do_POST(self):
        u = urlparse(self.path)
        try:
            length = int(self.headers.get("Content-Length", 0) or 0)
        except Exception:
            length = 0
        raw = self.rfile.read(length) if length else b""
        try:
            body = json.loads(raw.decode("utf-8")) if raw else {}
        except Exception:
            body = {}
        if u.path == "/api/visitor":
            return self._send_json(*api_visitor(body))
        if u.path == "/api/view":
            return self._send_json(*api_view(body))
        if u.path == "/api/clear":
            return self._send_json(*api_clear(body.get("scope", "all")))
        if u.path == "/api/auth/register":
            return self._send_json(*api_register(body))
        if u.path == "/api/auth/login":
            return self._send_json(*api_login(body))
        if u.path == "/api/watchlist/toggle":
            return self._send_json(*api_toggle_watchlist(self, body))
        return self._send_json(404, {"error": "not found"})

def decode_path(p):
    from urllib.parse import unquote
    return unquote(p)

# ---------------- 管理面板（内嵌网页） ----------------
MANAGE_HTML = r"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>StockScope 管理面板</title>
<style>
  :root{
    --bg:#0f1115; --card:#181b22; --card2:#1f232c; --line:#2a2f3a;
    --text:#e7e9ee; --sub:#9aa3b2; --blue:#3b82f6; --red:#ef4444;
    --green:#22c55e; --amber:#f59e0b;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;}
  .wrap{max-width:1080px;margin:0 auto;padding:24px 20px 48px;}
  header{display:flex;align-items:center;gap:12px;margin-bottom:22px;}
  header .logo{width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,var(--blue),#60a5fa);
    display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:20px;}
  header h1{font-size:19px;margin:0;font-weight:700;}
  header .badge{margin-left:auto;display:flex;align-items:center;gap:7px;font-size:13px;color:var(--sub);
    background:var(--card);border:1px solid var(--line);padding:6px 11px;border-radius:999px;}
  header .dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);}
  .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px;}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 18px;}
  .card .k{font-size:12.5px;color:var(--sub);margin-bottom:8px;}
  .card .v{font-size:26px;font-weight:800;letter-spacing:.5px;}
  .card .v small{font-size:13px;color:var(--sub);font-weight:600;margin-left:4px;}
  .grid2{display:grid;grid-template-columns:1.3fr 1fr;gap:16px;}
  .panel{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;}
  .panel h2{font-size:15px;margin:0 0 14px;display:flex;align-items:center;gap:8px;}
  .panel h2 .tag{margin-left:auto;font-size:11px;color:var(--sub);font-weight:600;}
  .row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);}
  .row:last-child{border-bottom:none;}
  .rank{width:22px;height:22px;border-radius:7px;background:var(--card2);color:var(--sub);
    display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex:none;}
  .rank.top{background:var(--amber);color:#1a1a1a;}
  .nm{font-weight:600;font-size:14px;}
  .cd{font-size:12px;color:var(--sub);margin-top:1px;}
  .bar{flex:1;height:8px;border-radius:6px;background:var(--card2);overflow:hidden;}
  .bar > i{display:block;height:100%;background:linear-gradient(90deg,var(--blue),#60a5fa);border-radius:6px;}
  .cnt{font-weight:800;font-size:14px;min-width:46px;text-align:right;}
  .vid{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;color:var(--blue);}
  .vmeta{font-size:12px;color:var(--sub);margin-top:2px;}
  .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;}
  button{font-family:inherit;cursor:pointer;border:1px solid var(--line);background:var(--card2);
    color:var(--text);padding:9px 15px;border-radius:10px;font-size:13.5px;font-weight:600;transition:.15s;}
  button:hover{border-color:var(--blue);}
  button.danger{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.4);color:#fca5a5;}
  button.danger:hover{background:rgba(239,68,68,.22);}
  .empty{color:var(--sub);font-size:13px;padding:18px 4px;text-align:center;}
  .foot{margin-top:22px;color:var(--sub);font-size:12px;text-align:center;}
  a{color:var(--blue);text-decoration:none;}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="logo">S</div>
    <h1>StockScope 管理面板</h1>
    <div class="badge"><span class="dot"></span><span id="live">实时</span></div>
  </header>

  <div class="cards">
    <div class="card"><div class="k">游客总数</div><div class="v" id="s-visitors">0</div></div>
    <div class="card"><div class="k">今日浏览</div><div class="v" id="s-today">0</div></div>
    <div class="card"><div class="k">累计浏览</div><div class="v" id="s-total">0</div></div>
    <div class="card"><div class="k">今日热门股</div><div class="v" id="s-stocks">0<small>只</small></div></div>
  </div>

  <div class="grid2">
    <div class="panel">
      <h2>今日热门排行 <span class="tag" id="hot-tag">/api/hot</span></h2>
      <div id="hot-list"></div>
    </div>
    <div class="panel">
      <h2>最近访客 <span class="tag" id="vis-tag">/api/visitors</span></h2>
      <div id="vis-list"></div>
    </div>
  </div>

  <div class="actions">
    <button id="btn-today" class="danger">清空今日数据</button>
    <button id="btn-all" class="danger">清空全部数据</button>
    <button onclick="location.reload()">立即刷新</button>
  </div>

  <div class="foot">数据落盘于 <code>stock-app-server-py/data/store.json</code> · 每 2 秒自动刷新 · 接口与 Node 版完全一致</div>
</div>

<script>
const $ = id => document.getElementById(id);
function rel(ts){ if(!ts) return "—"; const s=Math.floor((Date.now()-ts)/1000);
  if(s<60) return s+"秒前"; const m=Math.floor(s/60); if(m<60) return m+"分钟前";
  const h=Math.floor(m/60); if(h<24) return h+"小时前"; return Math.floor(h/24)+"天前"; }

async function load(){
  try{
    const [stats, hot, vis] = await Promise.all([
      fetch("/api/stats").then(r=>r.json()),
      fetch("/api/hot?limit=10").then(r=>r.json()),
      fetch("/api/visitors").then(r=>r.json()),
    ]);
    $("s-visitors").textContent = stats.visitors;
    $("s-today").textContent = stats.todayViews;
    $("s-total").textContent = stats.totalViews;
    $("s-stocks").innerHTML = stats.todayStocks + '<small>只</small>';

    const max = hot.length ? hot[0].count : 1;
    $("hot-list").innerHTML = hot.length ? hot.map((x,i)=>`
      <div class="row">
        <div class="rank ${i===0?'top':''}">${i+1}</div>
        <div style="min-width:150px"><div class="nm">${x.name}</div><div class="cd">${x.code}</div></div>
        <div class="bar"><i style="width:${Math.max(6,Math.round(x.count/max*100))}%"></i></div>
        <div class="cnt">${x.count}</div>
      </div>`).join("") : `<div class="empty">今日还没有浏览记录</div>`;

    $("vis-list").innerHTML = vis.length ? vis.slice(0,12).map(v=>`
      <div class="row">
        <div style="flex:1;min-width:0">
          <div class="vid">${v.id}</div>
          <div class="vmeta">浏览 ${v.totalViews} 次 · ${v.stocks} 只股票 · ${rel(v.lastSeen)}</div>
        </div>
      </div>`).join("") : `<div class="empty">暂无访客</div>`;
    $("live").textContent = "实时";
  }catch(e){
    $("live").textContent = "连接中断";
  }
}
async function clearData(scope){
  if(!confirm(scope==="all"?"确定清空全部数据（游客+浏览）？":"确定只清空今日浏览数据？")) return;
  await fetch("/api/clear",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({scope})});
  load();
}
$("btn-today").onclick = ()=>clearData("today");
$("btn-all").onclick = ()=>clearData("all");
load(); setInterval(load, 2000);
</script>
</body>
</html>
"""

def main():
    httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    sys.stderr.write("StockScope 服务器(Python)已启动: http://localhost:%d\n" % PORT)
    sys.stderr.write("静态目录: %s\n" % ROOT)
    sys.stderr.write("数据文件: %s\n" % DATA_FILE)
    sys.stderr.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == "__main__":
    main()
