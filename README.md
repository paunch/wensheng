<p align="center">
  <img width="160" src="resources/icons/icon.png" alt="闻声 logo">
</p>

<h1 align="center">闻声 · WenSheng</h1>

<p align="center">
  基于 <a href="https://github.com/lyswhut/lx-music-desktop">lx-music-desktop</a> 二次开发的桌面音乐播放器
</p>

## 简介

闻声是在 lx-music-desktop 基础上深度定制的桌面音乐播放器，主打多平台账号统一管理与个性化推荐。本项目为非商业用途的二次开发，完整保留上游署名与开源许可证。

## 主要功能

- **多平台账号**：支持网易云音乐、QQ 音乐、酷狗音乐、酷我音乐的网页登录（内嵌登录窗口）与手动 Cookie 添加；Cookie 仅保存在本地。
- **音乐馆**：单页三标签（推荐 / 排行榜），聚合各平台内容；雷达推荐自动翻页拉取 30 首。
- **我的列表**：在线歌单与"我喜欢"分开管理；红心收藏会同步到歌曲所属平台。
- **播放体验**：播放页专属样式（歌词位置、封面模糊背景、明暗背景），歌手/专辑点击跳转搜索，封面点击全屏放大。
- **云盘同步**：WebDAV 备份仅上传"我喜欢"收藏歌单，不上传设置等敏感信息。
- **界面**：左侧图标+文字导航、右上角设置入口、黑胶 LOGO 主题图标；统一主题配色。

## 下载

前往 [Releases](https://github.com/paunch/wensheng/releases) 下载 Windows 安装包（Setup.exe）或免安装版。

## 构建

```bash
npm install
npm run build      # 编译验证（输出到 dist）

# 只打免安装版（开发调试推荐，build/win-unpacked/wensheng.exe）
node build-config/build-pack.js target=dir

# 打完整安装包（build/wensheng-v1.0.0-x64-Setup.exe）
npm run pack
```

> 提示：Windows 下若构建工具清理 `build/` 触发删除保护，可先手动清空 `build/` 目录再构建。

详细使用说明见 [闻声-使用说明.md](闻声-使用说明.md)。

## 致谢与许可

- 本项目基于 [lx-music-desktop](https://github.com/lyswhut/lx-music-desktop)（lyswhut）二次开发，遵循其 Apache-2.0 许可证及补充协议。
- 上游项目地址：https://github.com/lyswhut/lx-music-desktop
- 本项目许可证见 [LICENSE](LICENSE)，上游权利声明完整保留。
- 本项目不收集任何用户账号信息，Cookie 仅本地存储。

## 免责声明

本项目仅用于个人学习与技术研究，请勿用于商业用途。音乐版权归各平台所有，本项目不提供任何音乐文件的下载与分发。
