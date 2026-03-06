'use strict'
/**
 * generate-icon.js – Pomodoro Timer Icon v3
 * 珊瑚色 Squircle 背景 · 白色大圆 · 珊瑚色五角星
 * 输出：resources/icon.png (256×256)  +  build/icon.ico (PNG-in-ICO)
 */

const zlib = require('node:zlib')
const fs   = require('node:fs')
const path = require('node:path')

const W = 256, H = 256
const CX = 128, CY = 128
const buf = new Float64Array(W * H * 4)

// ── 核心渲染基元 ──────────────────────────────────────────────────────────

function blend(x, y, r, g, b, a) {
  x = Math.round(x); y = Math.round(y)
  if (x < 0 || x >= W || y < 0 || y >= H || a <= 0) return
  const i = (y * W + x) * 4
  const sa = Math.min(1, Math.max(0, a))
  const da = buf[i + 3]
  const oa = sa + da * (1 - sa)
  if (oa < 1e-6) return
  buf[i]     = (r * sa + buf[i]     * da * (1 - sa)) / oa
  buf[i + 1] = (g * sa + buf[i + 1] * da * (1 - sa)) / oa
  buf[i + 2] = (b * sa + buf[i + 2] * da * (1 - sa)) / oa
  buf[i + 3] = oa
}

// ── 珊瑚色 #FF6B6B：(1.0, 0.420, 0.420) ──────────────────────────────────
const CORAL_R = 1.0, CORAL_G = 0.420, CORAL_B = 0.420

// ── 1. Squircle 背景（珊瑚色 #FF6B6B） ───────────────────────────────────
{
  const r = W / 2 - 4   // 半径 124px（留 4px 边距）
  const n = 5           // 超椭圆指数（近似 iOS 圆角图标）
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const nx = (x - CX) / r
      const ny = (y - CY) / r
      const v = Math.pow(Math.abs(nx), n) + Math.pow(Math.abs(ny), n)
      if (v > 1.06) continue
      const aa = Math.max(0, Math.min(1, (1.0 - v) * 20))
      blend(x, y, CORAL_R, CORAL_G, CORAL_B, aa)
    }
  }
}

// ── 2. 白色大圆 ───────────────────────────────────────────────────────────
{
  const CIRCLE_R = 96
  for (let dy = -CIRCLE_R - 2; dy <= CIRCLE_R + 2; dy++) {
    for (let dx = -CIRCLE_R - 2; dx <= CIRCLE_R + 2; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy)
      const aa = Math.max(0, Math.min(1, CIRCLE_R - d + 0.8))
      if (aa > 0) blend(CX + dx, CY + dy, 1.0, 1.0, 1.0, aa)
    }
  }
}

// ── 3. 五角星（珊瑚色，居中朝上） ────────────────────────────────────────
{
  const OUTER = 52    // 外尖半径
  const INNER = 22    // 内凹半径
  const N = 5
  const ROT = -Math.PI / 2   // 顶点朝上

  // 五角星 10 个顶点（外尖 / 内凹交替）
  const pts = []
  for (let i = 0; i < N * 2; i++) {
    const angle = ROT + (i * Math.PI) / N
    const r = i % 2 === 0 ? OUTER : INNER
    pts.push([CX + Math.cos(angle) * r, CY + Math.sin(angle) * r])
  }

  // 射线法判断点是否在多边形内
  function pointInPoly(px, py) {
    let inside = false
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1]
      const xj = pts[j][0], yj = pts[j][1]
      if (((yi > py) !== (yj > py)) &&
          (px < ((xj - xi) * (py - yi) / (yj - yi) + xi))) {
        inside = !inside
      }
    }
    return inside
  }

  // 点到线段的最短距离（用于抗锯齿）
  function distToEdges(px, py) {
    let minD = Infinity
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length
      const ax = pts[j][0] - pts[i][0], ay = pts[j][1] - pts[i][1]
      const bx = px - pts[i][0], by = py - pts[i][1]
      const t = Math.max(0, Math.min(1, (bx * ax + by * ay) / (ax * ax + ay * ay)))
      const dx = bx - t * ax, dy = by - t * ay
      minD = Math.min(minD, Math.sqrt(dx * dx + dy * dy))
    }
    return minD
  }

  const BBOX = OUTER + 2
  for (let dy = -BBOX; dy <= BBOX; dy++) {
    for (let dx = -BBOX; dx <= BBOX; dx++) {
      const px = CX + dx, py = CY + dy
      const dist = distToEdges(px, py)
      const inside = pointInPoly(px, py)
      // 内部实心 + 边缘 1px 抗锯齿
      const aa = inside
        ? Math.min(1, dist + 0.8)
        : Math.max(0, 0.8 - dist)
      if (aa > 0) blend(px, py, CORAL_R, CORAL_G, CORAL_B, aa)
    }
  }
}


// ── 编码为 PNG（无外部依赖） ───────────────────────────────────────────────

// Float → Uint8
const rgba8 = Buffer.alloc(W * H * 4)
for (let i = 0; i < W * H * 4; i++) {
  rgba8[i] = Math.max(0, Math.min(255, Math.round(buf[i] * 255)))
}

// CRC32 表
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c
  }
  return t
})()

function crc32(data) {
  let c = 0xFFFFFFFF
  for (const b of data) c = crcTable[(c ^ b) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf  = Buffer.allocUnsafe(4); lenBuf.writeUInt32BE(data.length)
  const crcBuf  = Buffer.allocUnsafe(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePNG(width, height, rgba) {
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(width,  0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = ihdr[11] = ihdr[12] = 0  // 8-bit RGBA

  // 每行加 Filter byte = 0（None over）
  const rows = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    rows[y * (1 + width * 4)] = 0
    rgba.copy(rows, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const idat = zlib.deflateSync(rows, { level: 9 })

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),  // PNG 签名
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}

const pngData = encodePNG(W, H, rgba8)

// ── 输出文件 ───────────────────────────────────────────────────────────────

const rootDir    = path.join(__dirname, '..')
const pngOutPath = path.join(rootDir, 'resources', 'icon.png')
const icoOutPath = path.join(rootDir, 'build', 'icon.ico')
const buildPngOutPath = path.join(rootDir, 'build', 'icon.png')

fs.mkdirSync(path.dirname(pngOutPath), { recursive: true })
fs.writeFileSync(pngOutPath, pngData)
console.log(`✅ resources/icon.png  (${pngData.length} bytes)`)

fs.mkdirSync(path.dirname(buildPngOutPath), { recursive: true })
fs.writeFileSync(buildPngOutPath, pngData)
console.log(`✅ build/icon.png      (${pngData.length} bytes)`)

// ── 生成 ICO（PNG-in-ICO，Windows Vista+） ────────────────────────────────
// ICO Header: Reserved(2) + Type=1(2) + Count=1(2) = 6 bytes
// Directory:  Width(1) + Height(1) + ColorCount(1) + Reserved(1) +
//             Planes(2) + BPP(2) + DataSize(4) + Offset(4) = 16 bytes
// Data:       pngData starting at offset 22

const icoHeader = Buffer.alloc(6)
icoHeader.writeUInt16LE(0, 0)   // Reserved
icoHeader.writeUInt16LE(1, 2)   // Type: 1 = ICO
icoHeader.writeUInt16LE(1, 4)   // Count: 1 image

const icoDir = Buffer.alloc(16)
icoDir[0] = 0                              // Width: 0 means 256
icoDir[1] = 0                              // Height: 0 means 256
icoDir[2] = 0                              // Color count: 0 = no palette
icoDir[3] = 0                              // Reserved
icoDir.writeUInt16LE(1,  4)               // Planes
icoDir.writeUInt16LE(32, 6)               // Bits per pixel
icoDir.writeUInt32LE(pngData.length, 8)   // Data size
icoDir.writeUInt32LE(22, 12)              // Offset from start of file

fs.mkdirSync(path.dirname(icoOutPath), { recursive: true })
fs.writeFileSync(icoOutPath, Buffer.concat([icoHeader, icoDir, pngData]))
console.log(`✅ build/icon.ico      (${icoHeader.length + icoDir.length + pngData.length} bytes)`)
