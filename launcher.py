#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
StockScope 后端 · 一键启动与管理器（tkinter，零依赖）
===================================================
- 一键启动 / 停止 Python 后端（server.py 子进程）
- 实时状态灯 + 每 2 秒刷新统计（游客 / 今日浏览 / 累计浏览）
- 一键打开「预览首页」与「管理面板」
- 一键清空数据、查看启动日志
"""
import os
import sys
import json
import subprocess
import threading
import urllib.request
import webbrowser
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_PY = os.path.join(BASE_DIR, "server.py")
PY = sys.executable

# 主题
BG = "#0f1115"; PANEL = "#181b22"; LINE = "#2a2f3a"
TEXT = "#e7e9ee"; SUB = "#9aa3b2"; BLUE = "#3b82f6"
GREEN = "#22c55e"; RED = "#ef4444"; AMBER = "#f59e0b"


class Launcher(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("StockScope 后端管理器")
        self.geometry("440x620")
        self.configure(bg=BG)
        self.resizable(False, False)
        self.process = None
        self.running = False
        self._build()
        self.protocol("WM_DELETE_WINDOW", self._on_close)
        self._poll_stats()

    # ---------- UI ----------
    def _build(self):
        # 顶部状态
        top = tk.Frame(self, bg=BG, padx=20, pady=16)
        top.pack(fill="x")
        tk.Label(top, text="StockScope", bg=BG, fg=TEXT,
                 font=("Segoe UI", 18, "bold")).pack(side="left")
        tk.Label(top, text="后端管理", bg=BG, fg=SUB,
                 font=("Segoe UI", 12)).pack(side="left", padx=(6, 0))
        self.dot = tk.Canvas(top, width=14, height=14, bg=BG, highlightthickness=0)
        self.dot.pack(side="right", padx=(0, 6))
        self._draw_dot(RED)
        self.status_lbl = tk.Label(top, text="已停止", bg=BG, fg=SUB,
                                   font=("Segoe UI", 12))
        self.status_lbl.pack(side="right")

        # 端口
        row = tk.Frame(self, bg=BG, padx=20)
        row.pack(fill="x", pady=(0, 8))
        tk.Label(row, text="端口", bg=BG, fg=SUB, font=("Segoe UI", 11)).pack(side="left")
        self.port_var = tk.StringVar(value="8080")
        self.port_entry = tk.Entry(row, textvariable=self.port_var, width=8,
                                   bg=PANEL, fg=TEXT, insertbackground=TEXT,
                                   font=("Segoe UI", 11), relief="flat",
                                   highlightbackground=LINE, highlightthickness=1)
        self.port_entry.pack(side="left", padx=(8, 0))

        # 启动/停止大按钮
        self.toggle_btn = tk.Button(self, text="▶  启动后端",
                                    command=self._toggle,
                                    bg=GREEN, fg="#06210f",
                                    font=("Segoe UI", 14, "bold"),
                                    relief="flat", height=2, cursor="hand2")
        self.toggle_btn.pack(fill="x", padx=20, pady=(4, 12))

        # 统计卡片
        cards = tk.Frame(self, bg=BG, padx=20)
        cards.pack(fill="x")
        self.stat = {}
        for key, label in [("visitors", "游客"), ("today", "今日浏览"), ("total", "累计浏览")]:
            c = tk.Frame(cards, bg=PANEL, highlightbackground=LINE,
                         highlightthickness=1)
            c.pack(side="left", expand=True, fill="x", padx=3, pady=2)
            v = tk.Label(c, text="0", bg=PANEL, fg=TEXT,
                         font=("Segoe UI", 20, "bold"))
            v.pack(pady=(10, 0))
            tk.Label(c, text=label, bg=PANEL, fg=SUB,
                     font=("Segoe UI", 10)).pack(pady=(0, 10))
            self.stat[key] = v

        # 操作按钮
        acts = tk.Frame(self, bg=BG, padx=20, pady=10)
        acts.pack(fill="x")
        b1 = tk.Button(acts, text="打开预览", command=lambda: self._open("/"),
                       bg=PANEL, fg=TEXT, font=("Segoe UI", 11),
                       relief="flat", highlightbackground=LINE, highlightthickness=1,
                       state="disabled", cursor="hand2")
        b2 = tk.Button(acts, text="管理面板", command=lambda: self._open("/manage"),
                       bg=PANEL, fg=TEXT, font=("Segoe UI", 11),
                       relief="flat", highlightbackground=LINE, highlightthickness=1,
                       state="disabled", cursor="hand2")
        b3 = tk.Button(acts, text="清空数据", command=self._clear,
                       bg=PANEL, fg="#fca5a5", font=("Segoe UI", 11),
                       relief="flat", highlightbackground=LINE, highlightthickness=1,
                       state="disabled", cursor="hand2")
        b1.pack(side="left", expand=True, fill="x", padx=3)
        b2.pack(side="left", expand=True, fill="x", padx=3)
        b3.pack(side="left", expand=True, fill="x", padx=3)
        self.act_btns = (b1, b2, b3)

        # 日志
        tk.Label(self, text="启动日志", bg=BG, fg=SUB,
                 font=("Segoe UI", 10), anchor="w").pack(fill="x", padx=20, pady=(12, 4))
        self.log = scrolledtext.ScrolledText(self, bg="#0b0d11", fg="#9fe6b0",
                                             font=("Consolas", 9),
                                             relief="flat", height=10,
                                             highlightbackground=LINE, highlightthickness=1,
                                             state="disabled")
        self.log.pack(fill="both", expand=True, padx=20, pady=(0, 14))

    def _draw_dot(self, color):
        self.dot.delete("all")
        self.dot.create_oval(2, 2, 12, 12, fill=color, outline="")

    def _log(self, msg):
        self.log.configure(state="normal")
        self.log.insert("end", msg + "\n")
        self.log.configure(state="disabled")
        self.log.see("end")

    # ---------- 控制 ----------
    def _toggle(self):
        if self.running:
            self._stop()
        else:
            self._start()

    def _start(self):
        port = self.port_var.get().strip()
        if not port.isdigit():
            messagebox.showerror("端口错误", "端口必须是数字")
            return
        env = dict(os.environ, PORT=port)
        try:
            self.process = subprocess.Popen(
                [PY, SERVER_PY], env=env, cwd=BASE_DIR,
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                creationflags=0x08000000)  # CREATE_NO_WINDOW
        except Exception as e:
            messagebox.showerror("启动失败", str(e))
            return
        self.running = True
        self._draw_dot(AMBER)
        self.status_lbl.configure(text="启动中…", fg=AMBER)
        self.toggle_btn.configure(text="■  停止后端", bg=RED, fg="#fff")
        self.port_entry.configure(state="disabled")
        for b in self.act_btns:
            b.configure(state="normal")
        self._log("启动后端，端口 %s …" % port)
        threading.Thread(target=self._read_output, daemon=True).start()

    def _read_output(self):
        for line in iter(self.process.stdout.readline, b""):
            try:
                txt = line.decode("utf-8", "replace").rstrip()
            except Exception:
                txt = str(line)
            if txt:
                try:
                    self.after(0, self._log, txt)
                except RuntimeError:
                    pass
        try:
            self.after(0, self._check_exit)
        except RuntimeError:
            pass

    def _check_exit(self):
        if self.process and self.process.poll() is not None and self.running:
            self._log("进程已退出 (code %s)" % self.process.returncode)
            self._stop(clean=False)

    def _stop(self, clean=True):
        if self.process and self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except Exception:
                self.process.kill()
        self.process = None
        self.running = False
        self._draw_dot(RED)
        self.status_lbl.configure(text="已停止", fg=SUB)
        self.toggle_btn.configure(text="▶  启动后端", bg=GREEN, fg="#06210f")
        self.port_entry.configure(state="normal")
        for b in self.act_btns:
            b.configure(state="disabled")
        if clean:
            self._log("已停止后端")

    def _open(self, path):
        if not self.running:
            messagebox.showwarning("未运行", "请先启动后端")
            return
        webbrowser.open("http://localhost:%s%s" % (self.port_var.get().strip(), path))

    def _clear(self):
        if not self.running:
            messagebox.showwarning("未运行", "请先启动后端")
            return
        if not messagebox.askyesno("清空数据", "确定清空全部数据（游客 + 浏览）？"):
            return
        try:
            req = urllib.request.Request(
                "http://localhost:%s/api/clear" % self.port_var.get().strip(),
                data=json.dumps({"scope": "all"}).encode("utf-8"),
                headers={"Content-Type": "application/json"}, method="POST")
            urllib.request.urlopen(req, timeout=5).read()
            self._log("已清空全部数据")
        except Exception as e:
            messagebox.showerror("清空失败", str(e))

    def _poll_stats(self):
        if self.running:
            try:
                with urllib.request.urlopen(
                        "http://localhost:%s/api/stats" % self.port_var.get().strip(),
                        timeout=2) as r:
                    d = json.loads(r.read().decode("utf-8"))
                self.stat["visitors"].configure(text=str(d.get("visitors", 0)))
                self.stat["today"].configure(text=str(d.get("todayViews", 0)))
                self.stat["total"].configure(text=str(d.get("totalViews", 0)))
                self._draw_dot(GREEN)
                self.status_lbl.configure(text="运行中", fg=GREEN)
            except Exception:
                self._draw_dot(AMBER)
                self.status_lbl.configure(text="连接中…", fg=AMBER)
        self.after(2000, self._poll_stats)

    def _on_close(self):
        if self.running:
            self._stop(clean=False)
        self.destroy()


if __name__ == "__main__":
    Launcher().mainloop()
