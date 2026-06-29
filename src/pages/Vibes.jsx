import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Aperture,
  Blend,
  BrushCleaning,
  Crop,
  Download,
  Eye,
  FileScan,
  FlipHorizontal,
  FlipVertical,
  Focus,
  Image as ImageIcon,
  Layers,
  Palette,
  Pipette,
  Redo2,
  RotateCcw,
  RotateCw,
  ScanLine,
  SlidersHorizontal,
  SlidersVertical,
  Sparkles,
  Sun,
  Undo2,
  Upload,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import useBgFit from '../hooks/useBgFit'
import { INITIAL_PHOTOS } from '../data/photos'

const DEFAULT_IMAGE = INITIAL_PHOTOS[44] || INITIAL_PHOTOS[0]

const DEFAULT_SETTINGS = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  hue: 0,
  sepia: 0,
  monochrome: 0,
  sharpen: 0,
  clarity: 0,
  texture: 0,
  dehaze: 0,
  blur: 0,
  noiseReduction: 0,
  bloom: 0,
  glow: 0,
  grain: 0,
  vignette: 0,
  fade: 0,
  curveShadows: 0,
  curveMidtones: 0,
  curveHighlights: 0,
  curveWhites: 0,
  redHue: 0,
  redSat: 0,
  redLum: 0,
  orangeHue: 0,
  orangeSat: 0,
  orangeLum: 0,
  yellowHue: 0,
  yellowSat: 0,
  yellowLum: 0,
  greenHue: 0,
  greenSat: 0,
  greenLum: 0,
  aquaHue: 0,
  aquaSat: 0,
  aquaLum: 0,
  blueHue: 0,
  blueSat: 0,
  blueLum: 0,
  purpleHue: 0,
  purpleSat: 0,
  purpleLum: 0,
  magentaHue: 0,
  magentaSat: 0,
  magentaLum: 0,
  gradeShadowHue: 220,
  gradeShadowSat: 0,
  gradeMidHue: 35,
  gradeMidSat: 0,
  gradeHighlightHue: 48,
  gradeHighlightSat: 0,
  gradeBalance: 0,
  touchupZone: 'center',
  skinSmooth: 0,
  blemishSoften: 0,
  complexionWarmth: 0,
  faceLight: 0,
  eyeDetail: 0,
  textureRecovery: 0,
  maskType: 'none',
  maskExposure: 0,
  maskContrast: 0,
  maskBlur: 0,
  maskFeather: 60,
  maskInvert: false,
  layerLight: true,
  layerColor: true,
  layerHsl: true,
  layerCurve: true,
  layerDetail: true,
  layerRetouch: true,
  layerMask: true,
  rotate: 0,
  flipX: false,
  flipY: false,
  cropRatio: 'original',
  cropZoom: 0,
  cropX: 0,
  cropY: 0,
}

const WORKSPACE_VERSION = 1
const WORKSPACE_APP_ID = 'skye-rackz-vibes'

function createSafeExportName(name, fallback = 'vibes-edit') {
  const safe = String(name || fallback)
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  return safe || fallback
}

function cloneSettings(settings = DEFAULT_SETTINGS) {
  return Object.keys(DEFAULT_SETTINGS).reduce((next, key) => ({
    ...next,
    [key]: Object.prototype.hasOwnProperty.call(settings, key) ? settings[key] : DEFAULT_SETTINGS[key],
  }), {})
}

function createOriginalHistory(settings = DEFAULT_SETTINGS) {
  return [{ settings: cloneSettings(settings), label: 'Original' }]
}

function normalizeHistoryEntries(entries, fallbackSettings = DEFAULT_SETTINGS) {
  if (!Array.isArray(entries) || entries.length === 0) return createOriginalHistory(fallbackSettings)

  return entries.slice(0, 40).map((entry, index) => ({
    settings: cloneSettings(entry?.settings || fallbackSettings),
    label: typeof entry?.label === 'string' && entry.label.trim()
      ? entry.label.trim().slice(0, 60)
      : index === 0 ? 'Original' : 'Edit',
  }))
}

function isWorkspaceImageSrc(src) {
  return typeof src === 'string' && (
    src.startsWith('data:image/') ||
    src.startsWith('/gallery/') ||
    src.startsWith('/backgrounds/')
  )
}

function createWorkspaceItem({
  id,
  src,
  name,
  local = false,
  settings = DEFAULT_SETTINGS,
  history,
  historyIndex = 0,
  exportName,
}) {
  const nextSettings = cloneSettings(settings)
  const nextHistory = normalizeHistoryEntries(history, nextSettings)
  const nextHistoryIndex = clamp(Number(historyIndex) || 0, 0, nextHistory.length - 1)
  const safeName = String(name || 'Photo').slice(0, 90)

  return {
    id: id || `workspace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    src,
    name: safeName,
    local: Boolean(local || src?.startsWith('data:image/')),
    settings: nextHistory[nextHistoryIndex]?.settings || nextSettings,
    history: nextHistory,
    historyIndex: nextHistoryIndex,
    exportName: createSafeExportName(exportName || safeName),
  }
}

function createGalleryWorkspaceItem(photo) {
  return createWorkspaceItem({
    id: `gallery-${photo.id}`,
    src: photo.src,
    name: photo.alt,
    local: false,
    settings: DEFAULT_SETTINGS,
    history: createOriginalHistory(DEFAULT_SETTINGS),
    historyIndex: 0,
    exportName: createSafeExportName(photo.alt),
  })
}

function createInitialWorkspaceItems() {
  const seen = new Set()
  return [DEFAULT_IMAGE, ...INITIAL_PHOTOS.slice(0, 12)]
    .filter(Boolean)
    .filter((photo) => {
      if (seen.has(photo.src)) return false
      seen.add(photo.src)
      return true
    })
    .map(createGalleryWorkspaceItem)
}

function normalizeWorkspaceItem(item, index) {
  const src = item?.src || item?.source?.src
  if (!isWorkspaceImageSrc(src)) return null

  return createWorkspaceItem({
    id: typeof item?.id === 'string' && item.id ? item.id : `workspace-import-${index}`,
    src,
    name: item?.name || item?.source?.name || `Workspace Photo ${index + 1}`,
    local: item?.local ?? item?.source?.local ?? src.startsWith('data:image/'),
    settings: item?.settings,
    history: item?.history,
    historyIndex: item?.historyIndex,
    exportName: item?.exportName,
  })
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

function isWorkspaceFile(file) {
  const name = file?.name?.toLowerCase() || ''
  return name.endsWith('.skyevibes') || name.endsWith('.json')
}

const INITIAL_WORKSPACE_ITEMS = createInitialWorkspaceItems()
const DEFAULT_WORKSPACE_ITEM = INITIAL_WORKSPACE_ITEMS[0]

const ADJUSTMENT_GROUPS = [
  {
    id: 'light',
    title: 'Light',
    icon: Sun,
    controls: [
      { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
      { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
      { key: 'highlights', label: 'Highlights', min: -100, max: 100 },
      { key: 'shadows', label: 'Shadows', min: -100, max: 100 },
      { key: 'whites', label: 'Whites', min: -100, max: 100 },
      { key: 'blacks', label: 'Blacks', min: -100, max: 100 },
    ],
  },
  {
    id: 'color',
    title: 'Color',
    icon: Palette,
    controls: [
      { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
      { key: 'vibrance', label: 'Vibrance', min: -100, max: 100 },
      { key: 'temperature', label: 'Temperature', min: -100, max: 100 },
      { key: 'tint', label: 'Tint', min: -100, max: 100 },
      { key: 'hue', label: 'Hue', min: -180, max: 180 },
      { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
      { key: 'monochrome', label: 'Mono', min: 0, max: 100 },
    ],
  },
  {
    id: 'detail',
    title: 'Detail',
    icon: Aperture,
    controls: [
      { key: 'clarity', label: 'Clarity', min: -100, max: 100 },
      { key: 'texture', label: 'Texture', min: -100, max: 100 },
      { key: 'dehaze', label: 'Dehaze', min: -100, max: 100 },
      { key: 'sharpen', label: 'Sharpen', min: 0, max: 100 },
      { key: 'blur', label: 'Blur', min: 0, max: 20 },
      { key: 'noiseReduction', label: 'Noise Reduce', min: 0, max: 100 },
      { key: 'bloom', label: 'Bloom', min: 0, max: 100 },
      { key: 'glow', label: 'Glow', min: 0, max: 100 },
      { key: 'grain', label: 'Grain', min: 0, max: 100 },
      { key: 'vignette', label: 'Vignette', min: 0, max: 100 },
      { key: 'fade', label: 'Fade', min: 0, max: 100 },
    ],
  },
]

const HSL_CHANNELS = [
  { id: 'red', label: 'Red', swatch: '#ff4b54' },
  { id: 'orange', label: 'Orange', swatch: '#ff9340' },
  { id: 'yellow', label: 'Yellow', swatch: '#ffd33d' },
  { id: 'green', label: 'Green', swatch: '#26e66f' },
  { id: 'aqua', label: 'Aqua', swatch: '#20d7d7' },
  { id: 'blue', label: 'Blue', swatch: '#4aa7ff' },
  { id: 'purple', label: 'Purple', swatch: '#9b66ff' },
  { id: 'magenta', label: 'Magenta', swatch: '#ff2aa1' },
]

const CURVE_CONTROLS = [
  { key: 'curveShadows', label: 'Shadows', min: -100, max: 100 },
  { key: 'curveMidtones', label: 'Midtones', min: -100, max: 100 },
  { key: 'curveHighlights', label: 'Highlights', min: -100, max: 100 },
  { key: 'curveWhites', label: 'Whites', min: -100, max: 100 },
]

const GRADING_CONTROLS = [
  { key: 'gradeShadowHue', label: 'Shadow Hue', min: 0, max: 360 },
  { key: 'gradeShadowSat', label: 'Shadow Sat', min: 0, max: 100 },
  { key: 'gradeMidHue', label: 'Mid Hue', min: 0, max: 360 },
  { key: 'gradeMidSat', label: 'Mid Sat', min: 0, max: 100 },
  { key: 'gradeHighlightHue', label: 'Highlight Hue', min: 0, max: 360 },
  { key: 'gradeHighlightSat', label: 'Highlight Sat', min: 0, max: 100 },
  { key: 'gradeBalance', label: 'Balance', min: -100, max: 100 },
]

const TOUCHUP_CONTROLS = [
  { key: 'skinSmooth', label: 'Surface Smooth', min: 0, max: 100 },
  { key: 'blemishSoften', label: 'Spot Soften', min: 0, max: 100 },
  { key: 'complexionWarmth', label: 'Complexion', min: -100, max: 100 },
  { key: 'faceLight', label: 'Face Light', min: 0, max: 100 },
  { key: 'eyeDetail', label: 'Eye Detail', min: 0, max: 100 },
  { key: 'textureRecovery', label: 'Texture Back', min: 0, max: 100 },
]

const TOUCHUP_ZONES = [
  { id: 'center', label: 'Center' },
  { id: 'upper', label: 'Upper' },
  { id: 'lower', label: 'Lower' },
  { id: 'full', label: 'Full' },
]

const MASK_TYPES = [
  { id: 'none', label: 'None' },
  { id: 'radial', label: 'Radial' },
  { id: 'linear', label: 'Linear' },
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'edge', label: 'Edge' },
]

const MASK_CONTROLS = [
  { key: 'maskExposure', label: 'Exposure', min: -100, max: 100 },
  { key: 'maskContrast', label: 'Contrast', min: -100, max: 100 },
  { key: 'maskBlur', label: 'Blur', min: 0, max: 100 },
  { key: 'maskFeather', label: 'Feather', min: 0, max: 100 },
]

const LAYER_STACK = [
  { key: 'layerLight', label: 'Light pass', detail: 'Exposure, contrast, whites, blacks' },
  { key: 'layerColor', label: 'Color pass', detail: 'Temperature, tint, grade, mono' },
  { key: 'layerHsl', label: 'HSL mixer', detail: 'Channel hue, sat, luminance' },
  { key: 'layerCurve', label: 'Tone curve', detail: 'Shadows, mids, highs, whites' },
  { key: 'layerDetail', label: 'Detail FX', detail: 'Texture, dehaze, grain, glow' },
  { key: 'layerRetouch', label: 'Touch-up', detail: 'Bounded correction controls only' },
  { key: 'layerMask', label: 'Mask pass', detail: 'Gradient and radial local edits' },
]

const CROP_RATIOS = [
  { id: 'original', label: 'Original' },
  { id: '1:1', label: '1:1' },
  { id: '4:5', label: '4:5' },
  { id: '3:2', label: '3:2' },
  { id: '16:9', label: '16:9' },
  { id: '9:16', label: '9:16' },
]

const HISTORY_LABELS = {
  ...Object.fromEntries(
    ADJUSTMENT_GROUPS.flatMap((group) => group.controls.map((control) => [control.key, control.label]))
  ),
  ...Object.fromEntries(CURVE_CONTROLS.map((control) => [control.key, control.label])),
  ...Object.fromEntries(GRADING_CONTROLS.map((control) => [control.key, control.label])),
  ...Object.fromEntries(TOUCHUP_CONTROLS.map((control) => [control.key, control.label])),
  ...Object.fromEntries(MASK_CONTROLS.map((control) => [control.key, control.label])),
  ...Object.fromEntries(
    HSL_CHANNELS.flatMap((channel) => [
      [`${channel.id}Hue`, `${channel.label} Hue`],
      [`${channel.id}Sat`, `${channel.label} Sat`],
      [`${channel.id}Lum`, `${channel.label} Lum`],
    ])
  ),
  ...Object.fromEntries(LAYER_STACK.map((layer) => [layer.key, layer.label])),
  cropRatio: 'Crop',
  cropZoom: 'Crop Scale',
  cropX: 'Crop X',
  cropY: 'Crop Y',
  rotate: 'Straighten',
  flipX: 'Flip X',
  flipY: 'Flip Y',
  touchupZone: 'Touch-up Zone',
  maskType: 'Mask Type',
  maskInvert: 'Invert Mask',
}

const PRESETS = [
  {
    id: 'clean',
    label: 'Clean Pro',
    settings: {
      exposure: 8,
      contrast: 12,
      highlights: -8,
      shadows: 12,
      saturation: 4,
      vibrance: 10,
      clarity: 12,
      texture: 8,
      dehaze: 6,
      sharpen: 18,
      noiseReduction: 12,
    },
  },
  {
    id: 'chrome',
    label: 'Chrome',
    settings: {
      contrast: 28,
      highlights: -18,
      shadows: 20,
      whites: 8,
      blacks: -20,
      saturation: -8,
      clarity: 24,
      texture: 18,
      dehaze: 28,
      sharpen: 28,
      vignette: 24,
      curveShadows: -12,
      curveHighlights: 14,
    },
  },
  {
    id: 'neon',
    label: 'Neon',
    settings: {
      exposure: 4,
      contrast: 22,
      shadows: 14,
      saturation: 28,
      vibrance: 36,
      tint: 18,
      hue: -8,
      clarity: 18,
      dehaze: 16,
      bloom: 14,
      glow: 10,
      vignette: 34,
      gradeShadowSat: 18,
      gradeHighlightSat: 22,
    },
  },
  {
    id: 'noir',
    label: 'Noir',
    settings: {
      contrast: 34,
      highlights: -14,
      shadows: 8,
      blacks: -28,
      saturation: -100,
      monochrome: 100,
      clarity: 30,
      texture: 12,
      sharpen: 22,
      grain: 18,
      vignette: 42,
      curveShadows: -16,
      curveWhites: 10,
    },
  },
  {
    id: 'warm-film',
    label: 'Warm Film',
    settings: {
      exposure: 6,
      contrast: -8,
      highlights: -18,
      shadows: 18,
      saturation: 10,
      temperature: 30,
      tint: 6,
      grain: 22,
      fade: 18,
      vignette: 12,
      curveMidtones: 10,
      orangeSat: 12,
    },
  },
  {
    id: 'matte',
    label: 'Matte',
    settings: {
      exposure: 2,
      contrast: -16,
      highlights: -28,
      shadows: 28,
      blacks: 20,
      saturation: -10,
      fade: 30,
      grain: 12,
      curveShadows: 18,
      curveHighlights: -12,
    },
  },
  {
    id: 'editorial',
    label: 'Editorial',
    settings: {
      exposure: 4,
      contrast: 18,
      highlights: -24,
      shadows: 16,
      saturation: -6,
      vibrance: 12,
      clarity: 16,
      texture: 10,
      dehaze: 18,
      skinSmooth: 8,
      faceLight: 12,
      vignette: 18,
    },
  },
  {
    id: 'soft-glam',
    label: 'Soft Glam',
    settings: {
      exposure: 10,
      contrast: -6,
      highlights: -20,
      shadows: 18,
      temperature: 10,
      tint: 4,
      vibrance: 8,
      skinSmooth: 26,
      blemishSoften: 18,
      complexionWarmth: 18,
      glow: 16,
      bloom: 8,
    },
  },
  {
    id: 'crisp-social',
    label: 'Crisp Social',
    settings: {
      exposure: 7,
      contrast: 22,
      whites: 8,
      blacks: -16,
      saturation: 14,
      vibrance: 22,
      clarity: 18,
      texture: 14,
      sharpen: 30,
      blueSat: 10,
      magentaSat: 8,
    },
  },
]

const TOOL_MODES = [
  { id: 'adjust', label: 'Adjust', icon: SlidersHorizontal },
  { id: 'presets', label: 'Presets', icon: Wand2 },
  { id: 'hsl', label: 'HSL', icon: Pipette },
  { id: 'curve', label: 'Curve', icon: ScanLine },
  { id: 'grade', label: 'Grade', icon: Blend },
  { id: 'mask', label: 'Masks', icon: Focus },
  { id: 'retouch', label: 'Touch-up', icon: BrushCleaning },
  { id: 'crop', label: 'Crop', icon: Crop },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'info', label: 'Info', icon: FileScan },
  { id: 'export', label: 'Export', icon: Download },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function settingsEqual(a, b) {
  return Object.keys(DEFAULT_SETTINGS).every((key) => a[key] === b[key])
}

function normalizeDegrees(value) {
  return ((((value + 180) % 360) + 360) % 360) - 180
}

function getRatioValue(ratioId, fallback) {
  if (ratioId === 'original') return fallback
  const [w, h] = ratioId.split(':').map(Number)
  return w && h ? w / h : fallback
}

function getCanvasSize(image, ratioId) {
  const sourceRatio = image.naturalWidth / image.naturalHeight
  const targetRatio = getRatioValue(ratioId, sourceRatio)
  let width = image.naturalWidth
  let height = image.naturalHeight

  if (targetRatio > sourceRatio) {
    height = Math.round(width / targetRatio)
  } else {
    width = Math.round(height * targetRatio)
  }

  const maxEdge = 2400
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    sourceRatio,
  }
}

function getCropSourceRect(image, targetRatio, sourceRatio, cropX = 0, cropY = 0, cropZoom = 0) {
  let baseSw = image.naturalWidth
  let baseSh = image.naturalHeight

  if (targetRatio > sourceRatio) {
    baseSh = Math.round(baseSw / targetRatio)
  } else {
    baseSw = Math.round(baseSh * targetRatio)
  }

  const zoomScale = 1 + (clamp(cropZoom, 0, 200) / 100)
  const sw = Math.max(1, Math.round(baseSw / zoomScale))
  const sh = Math.max(1, Math.round(baseSh / zoomScale))
  const maxSx = Math.max(0, image.naturalWidth - sw)
  const maxSy = Math.max(0, image.naturalHeight - sh)
  const sx = Math.round(clamp((maxSx / 2) - ((cropX / 100) * (maxSx / 2)), 0, maxSx))
  const sy = Math.round(clamp((maxSy / 2) - ((cropY / 100) * (maxSy / 2)), 0, maxSy))

  return {
    sx,
    sy,
    sw,
    sh,
    maxSx,
    maxSy,
  }
}

function drawFittedImage(ctx, image, canvasWidth, canvasHeight, sourceRatio, cropX = 0, cropY = 0, cropZoom = 0) {
  const targetRatio = canvasWidth / canvasHeight
  const { sx, sy, sw, sh } = getCropSourceRect(image, targetRatio, sourceRatio, cropX, cropY, cropZoom)

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvasWidth, canvasHeight)
}

function drawBase(ctx, image, settings, canvasWidth, canvasHeight, sourceRatio, processed = true) {
  ctx.save()
  ctx.translate(canvasWidth / 2, canvasHeight / 2)
  ctx.rotate((settings.rotate * Math.PI) / 180)
  ctx.scale(settings.flipX ? -1 : 1, settings.flipY ? -1 : 1)
  ctx.translate(-canvasWidth / 2, -canvasHeight / 2)

  if (processed) {
    const lightEnabled = settings.layerLight
    const colorEnabled = settings.layerColor
    const detailEnabled = settings.layerDetail
    const brightness = clamp(
      100 +
        (lightEnabled
          ? settings.exposure * 0.65 + settings.whites * 0.18 + settings.shadows * 0.08 - settings.blacks * 0.08
          : 0),
      15,
      220
    )
    const contrast = clamp(
      100 +
        (lightEnabled ? settings.contrast : 0) +
        (detailEnabled ? settings.clarity * 0.22 + settings.dehaze * 0.35 : 0),
      10,
      260
    )
    const saturate = clamp(100 + (colorEnabled ? settings.saturation + settings.vibrance * 0.55 : 0), 0, 280)
    const blur = detailEnabled ? settings.blur * 0.08 + settings.noiseReduction * 0.012 : 0
    ctx.filter = [
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
      `saturate(${saturate}%)`,
      `sepia(${colorEnabled ? settings.sepia : 0}%)`,
      `grayscale(${colorEnabled ? settings.monochrome : 0}%)`,
      `hue-rotate(${colorEnabled ? settings.hue : 0}deg)`,
      `blur(${blur}px)`,
    ].join(' ')
  } else {
    ctx.filter = 'none'
  }

  drawFittedImage(ctx, image, canvasWidth, canvasHeight, sourceRatio, settings.cropX, settings.cropY, settings.cropZoom)
  ctx.restore()
  ctx.filter = 'none'
}

function hueToRgb(p, q, t) {
  let hue = t
  if (hue < 0) hue += 1
  if (hue > 1) hue -= 1
  if (hue < 1 / 6) return p + (q - p) * 6 * hue
  if (hue < 1 / 2) return q
  if (hue < 2 / 3) return p + (q - p) * (2 / 3 - hue) * 6
  return p
}

function rgbToHsl(red, green, blue) {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    if (max === g) h = (b - r) / d + 2
    if (max === b) h = (r - g) / d + 4
    h /= 6
  }

  return [h * 360, s, l]
}

function hslToRgb(hue, saturation, lightness) {
  const h = (((hue % 360) + 360) % 360) / 360
  const s = clamp(saturation, 0, 1)
  const l = clamp(lightness, 0, 1)

  if (s === 0) {
    const value = Math.round(l * 255)
    return [value, value, value]
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  ]
}

function getHslChannel(hue) {
  if (hue < 15 || hue >= 345) return 'red'
  if (hue < 45) return 'orange'
  if (hue < 75) return 'yellow'
  if (hue < 165) return 'green'
  if (hue < 205) return 'aqua'
  if (hue < 255) return 'blue'
  if (hue < 295) return 'purple'
  return 'magenta'
}

function hasPixelAdjustments(settings) {
  const hasHsl = settings.layerHsl && HSL_CHANNELS.some((channel) => (
    settings[`${channel.id}Hue`] !== 0 ||
    settings[`${channel.id}Sat`] !== 0 ||
    settings[`${channel.id}Lum`] !== 0
  ))
  const hasCurve = settings.layerCurve && CURVE_CONTROLS.some((control) => settings[control.key] !== 0)
  return hasHsl || hasCurve
}

function applyPixelAdjustments(ctx, settings, canvasWidth, canvasHeight) {
  if (!hasPixelAdjustments(settings)) return

  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
  const { data } = imageData
  const hslEnabled = settings.layerHsl
  const curveEnabled = settings.layerCurve

  for (let index = 0; index < data.length; index += 4) {
    let red = data[index]
    let green = data[index + 1]
    let blue = data[index + 2]

    if (hslEnabled) {
      const [hue, saturation, lightness] = rgbToHsl(red, green, blue)
      const channel = getHslChannel(hue)
      const nextHue = hue + settings[`${channel}Hue`]
      const nextSaturation = clamp(saturation * (1 + settings[`${channel}Sat`] / 100), 0, 1)
      const nextLightness = clamp(lightness + settings[`${channel}Lum`] / 220, 0, 1)
      ;[red, green, blue] = hslToRgb(nextHue, nextSaturation, nextLightness)
    }

    if (curveEnabled) {
      for (let offset = 0; offset < 3; offset += 1) {
        const value = [red, green, blue][offset] / 255
        const shadowWeight = (1 - value) * (1 - value)
        const midWeight = 1 - Math.min(1, Math.abs(value - 0.5) * 2)
        const highWeight = value * value
        const whiteWeight = Math.pow(value, 5)
        const delta =
          settings.curveShadows * shadowWeight +
          settings.curveMidtones * midWeight +
          settings.curveHighlights * highWeight +
          settings.curveWhites * whiteWeight
        const adjusted = clamp(value + delta / 255, 0, 1) * 255
        if (offset === 0) red = adjusted
        if (offset === 1) green = adjusted
        if (offset === 2) blue = adjusted
      }
    }

    data[index] = clamp(Math.round(red), 0, 255)
    data[index + 1] = clamp(Math.round(green), 0, 255)
    data[index + 2] = clamp(Math.round(blue), 0, 255)
  }

  ctx.putImageData(imageData, 0, 0)
}

function hslColor(hue, saturation, lightness = 54) {
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

function drawBlurredCopy(ctx, canvasWidth, canvasHeight, blurAmount, opacity, composite = 'screen') {
  const snapshot = document.createElement('canvas')
  snapshot.width = canvasWidth
  snapshot.height = canvasHeight
  const snapshotCtx = snapshot.getContext('2d')
  snapshotCtx.filter = `blur(${blurAmount}px)`
  snapshotCtx.drawImage(ctx.canvas, 0, 0)

  ctx.save()
  ctx.globalCompositeOperation = composite
  ctx.globalAlpha = opacity
  ctx.drawImage(snapshot, 0, 0)
  ctx.restore()
  ctx.filter = 'none'
}

function applyOverlays(ctx, settings, canvasWidth, canvasHeight) {
  const lightEnabled = settings.layerLight
  const colorEnabled = settings.layerColor
  const detailEnabled = settings.layerDetail

  if (lightEnabled && settings.highlights !== 0) {
    ctx.save()
    ctx.globalCompositeOperation = settings.highlights > 0 ? 'screen' : 'multiply'
    ctx.globalAlpha = Math.abs(settings.highlights) / 360
    ctx.fillStyle = settings.highlights > 0 ? '#ffffff' : '#151515'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.restore()
  }

  if (lightEnabled && settings.shadows !== 0) {
    ctx.save()
    ctx.globalCompositeOperation = settings.shadows > 0 ? 'screen' : 'multiply'
    ctx.globalAlpha = Math.abs(settings.shadows) / 420
    ctx.fillStyle = settings.shadows > 0 ? '#b8c7ff' : '#080808'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.restore()
  }

  if (colorEnabled && (settings.temperature !== 0 || settings.tint !== 0)) {
    ctx.save()
    ctx.globalCompositeOperation = 'soft-light'
    ctx.globalAlpha = clamp((Math.abs(settings.temperature) + Math.abs(settings.tint)) / 260, 0, 0.55)
    const warm = settings.temperature >= 0 ? '255, 165, 72' : '92, 160, 255'
    const tint = settings.tint >= 0 ? '236, 80, 210' : '80, 220, 165'
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
    gradient.addColorStop(0, `rgb(${warm})`)
    gradient.addColorStop(1, `rgb(${tint})`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.restore()
  }

  if (colorEnabled && (settings.gradeShadowSat > 0 || settings.gradeMidSat > 0 || settings.gradeHighlightSat > 0)) {
    const gradient = ctx.createLinearGradient(0, canvasHeight, canvasWidth, 0)
    gradient.addColorStop(0, hslColor(settings.gradeShadowHue, settings.gradeShadowSat, 34))
    gradient.addColorStop(0.48 + settings.gradeBalance / 300, hslColor(settings.gradeMidHue, settings.gradeMidSat, 50))
    gradient.addColorStop(1, hslColor(settings.gradeHighlightHue, settings.gradeHighlightSat, 64))
    ctx.save()
    ctx.globalCompositeOperation = 'soft-light'
    ctx.globalAlpha = clamp((settings.gradeShadowSat + settings.gradeMidSat + settings.gradeHighlightSat) / 280, 0, 0.55)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.restore()
  }

  if (lightEnabled && settings.fade > 0) {
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    ctx.globalAlpha = settings.fade / 380
    ctx.fillStyle = '#d9d0c2'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.restore()
  }

  if (detailEnabled && (settings.clarity !== 0 || settings.texture !== 0 || settings.dehaze !== 0)) {
    ctx.save()
    const detailValue = settings.clarity + settings.texture * 0.55 + settings.dehaze * 0.65
    ctx.globalCompositeOperation = detailValue > 0 ? 'overlay' : 'screen'
    ctx.globalAlpha = clamp(Math.abs(detailValue) / 430, 0, 0.48)
    ctx.fillStyle = detailValue > 0 ? '#ffffff' : '#2c2c2c'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.restore()
  }

  if (detailEnabled && settings.noiseReduction > 0) {
    drawBlurredCopy(ctx, canvasWidth, canvasHeight, 0.8 + settings.noiseReduction / 28, settings.noiseReduction / 520, 'normal')
  }

  if (detailEnabled && (settings.bloom > 0 || settings.glow > 0)) {
    drawBlurredCopy(
      ctx,
      canvasWidth,
      canvasHeight,
      5 + (settings.bloom + settings.glow) / 9,
      clamp((settings.bloom * 0.9 + settings.glow) / 310, 0, 0.62),
      'screen'
    )
  }

  if (detailEnabled && settings.sharpen > 0) {
    ctx.save()
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = settings.sharpen / 500
    ctx.filter = 'contrast(180%) saturate(115%)'
    ctx.drawImage(ctx.canvas, 0, 0)
    ctx.restore()
    ctx.filter = 'none'
  }

  if (detailEnabled && settings.vignette > 0) {
    const radius = Math.max(canvasWidth, canvasHeight) * 0.72
    const gradient = ctx.createRadialGradient(
      canvasWidth / 2,
      canvasHeight / 2,
      radius * 0.12,
      canvasWidth / 2,
      canvasHeight / 2,
      radius
    )
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(0.55, 'rgba(0,0,0,0.06)')
    gradient.addColorStop(1, `rgba(0,0,0,${settings.vignette / 95})`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  }

  if (detailEnabled && settings.grain > 0) {
    const density = Math.round((canvasWidth * canvasHeight * settings.grain) / 42000)
    ctx.save()
    ctx.globalAlpha = settings.grain / 240
    for (let i = 0; i < density; i += 1) {
      const shade = Math.random() > 0.5 ? 255 : 0
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`
      ctx.fillRect(Math.random() * canvasWidth, Math.random() * canvasHeight, 1, 1)
    }
    ctx.restore()
  }
}

function createZoneGradient(ctx, canvasWidth, canvasHeight, zone, color = '255,255,255', feather = 0.78) {
  if (zone === 'full') {
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
    gradient.addColorStop(0, `rgba(${color}, 1)`)
    gradient.addColorStop(1, `rgba(${color}, 1)`)
    return gradient
  }

  const zoneMap = {
    center: [0.52, 0.42, 0.5],
    upper: [0.52, 0.28, 0.42],
    lower: [0.52, 0.62, 0.45],
  }
  const [x, y, radius] = zoneMap[zone] || zoneMap.center
  const maxRadius = Math.max(canvasWidth, canvasHeight) * radius
  const gradient = ctx.createRadialGradient(
    canvasWidth * x,
    canvasHeight * y,
    maxRadius * 0.08,
    canvasWidth * x,
    canvasHeight * y,
    maxRadius
  )
  gradient.addColorStop(0, `rgba(${color}, 1)`)
  gradient.addColorStop(clamp(feather, 0.1, 0.98), `rgba(${color}, 0.65)`)
  gradient.addColorStop(1, `rgba(${color}, 0)`)
  return gradient
}

function drawMaskedBlur(ctx, canvasWidth, canvasHeight, settings, blurAmount, opacity) {
  const snapshot = document.createElement('canvas')
  snapshot.width = canvasWidth
  snapshot.height = canvasHeight
  const snapshotCtx = snapshot.getContext('2d')
  snapshotCtx.filter = `blur(${blurAmount}px)`
  snapshotCtx.drawImage(ctx.canvas, 0, 0)
  snapshotCtx.filter = 'none'
  snapshotCtx.globalCompositeOperation = 'destination-in'
  snapshotCtx.fillStyle = createZoneGradient(snapshotCtx, canvasWidth, canvasHeight, settings.touchupZone, '255,255,255')
  snapshotCtx.fillRect(0, 0, canvasWidth, canvasHeight)

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.drawImage(snapshot, 0, 0)
  ctx.restore()
}

function applyRetouch(ctx, settings, canvasWidth, canvasHeight) {
  if (!settings.layerRetouch) return
  const retouchTotal = settings.skinSmooth + settings.blemishSoften + Math.abs(settings.complexionWarmth) + settings.faceLight + settings.eyeDetail
  if (retouchTotal <= 0) return

  if (settings.skinSmooth > 0 || settings.blemishSoften > 0) {
    drawMaskedBlur(
      ctx,
      canvasWidth,
      canvasHeight,
      settings,
      1.2 + (settings.skinSmooth + settings.blemishSoften) / 32,
      clamp((settings.skinSmooth + settings.blemishSoften) / 310, 0, 0.48)
    )
  }

  if (settings.complexionWarmth !== 0 || settings.faceLight > 0) {
    ctx.save()
    ctx.globalCompositeOperation = settings.complexionWarmth >= 0 ? 'soft-light' : 'screen'
    ctx.globalAlpha = clamp((Math.abs(settings.complexionWarmth) + settings.faceLight) / 260, 0, 0.48)
    const color = settings.complexionWarmth >= 0 ? '255,178,116' : '160,188,255'
    ctx.fillStyle = createZoneGradient(ctx, canvasWidth, canvasHeight, settings.touchupZone, color)
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.restore()
  }

  if (settings.faceLight > 0) {
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    ctx.globalAlpha = settings.faceLight / 360
    ctx.fillStyle = createZoneGradient(ctx, canvasWidth, canvasHeight, settings.touchupZone, '255,255,255')
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.restore()
  }

  if (settings.eyeDetail > 0 || settings.textureRecovery > 0) {
    ctx.save()
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = clamp((settings.eyeDetail + settings.textureRecovery) / 360, 0, 0.42)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight * 0.45)
    ctx.restore()
  }
}

function createMaskGradient(ctx, canvasWidth, canvasHeight, settings, color) {
  const alphaA = settings.maskInvert ? 0 : 1
  const alphaB = settings.maskInvert ? 1 : 0
  const feather = clamp(settings.maskFeather / 100, 0.05, 0.95)
  const rgba = (alpha) => `rgba(${color}, ${alpha})`

  if (settings.maskType === 'linear') {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight)
    gradient.addColorStop(0, rgba(alphaA))
    gradient.addColorStop(feather, rgba(alphaA * 0.6))
    gradient.addColorStop(1, rgba(alphaB))
    return gradient
  }

  if (settings.maskType === 'edge') {
    const gradient = ctx.createRadialGradient(
      canvasWidth / 2,
      canvasHeight / 2,
      Math.min(canvasWidth, canvasHeight) * feather * 0.35,
      canvasWidth / 2,
      canvasHeight / 2,
      Math.max(canvasWidth, canvasHeight) * 0.72
    )
    gradient.addColorStop(0, rgba(alphaB))
    gradient.addColorStop(1, rgba(alphaA))
    return gradient
  }

  const radius = settings.maskType === 'spotlight' ? 0.42 : 0.58
  const gradient = ctx.createRadialGradient(
    canvasWidth * 0.52,
    canvasHeight * 0.42,
    Math.min(canvasWidth, canvasHeight) * 0.05,
    canvasWidth * 0.52,
    canvasHeight * 0.42,
    Math.max(canvasWidth, canvasHeight) * radius
  )
  gradient.addColorStop(0, rgba(alphaA))
  gradient.addColorStop(feather, rgba(alphaA * 0.5))
  gradient.addColorStop(1, rgba(alphaB))
  return gradient
}

function applyMask(ctx, settings, canvasWidth, canvasHeight) {
  if (!settings.layerMask || settings.maskType === 'none') return
  const hasMaskEffect = settings.maskExposure !== 0 || settings.maskContrast !== 0 || settings.maskBlur > 0
  if (!hasMaskEffect) return

  if (settings.maskBlur > 0) {
    const snapshot = document.createElement('canvas')
    snapshot.width = canvasWidth
    snapshot.height = canvasHeight
    const snapshotCtx = snapshot.getContext('2d')
    snapshotCtx.filter = `blur(${settings.maskBlur / 7}px)`
    snapshotCtx.drawImage(ctx.canvas, 0, 0)
    snapshotCtx.filter = 'none'
    snapshotCtx.globalCompositeOperation = 'destination-in'
    snapshotCtx.fillStyle = createMaskGradient(snapshotCtx, canvasWidth, canvasHeight, settings, '255,255,255')
    snapshotCtx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.drawImage(snapshot, 0, 0)
  }

  if (settings.maskExposure !== 0) {
    ctx.save()
    ctx.globalCompositeOperation = settings.maskExposure > 0 ? 'screen' : 'multiply'
    ctx.globalAlpha = Math.abs(settings.maskExposure) / 260
    ctx.fillStyle = createMaskGradient(ctx, canvasWidth, canvasHeight, settings, settings.maskExposure > 0 ? '255,255,255' : '0,0,0')
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.restore()
  }

  if (settings.maskContrast !== 0) {
    ctx.save()
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = Math.abs(settings.maskContrast) / 300
    ctx.fillStyle = createMaskGradient(ctx, canvasWidth, canvasHeight, settings, settings.maskContrast > 0 ? '255,255,255' : '32,32,32')
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.restore()
  }
}

function renderEditedCanvas(canvas, image, settings, options = {}) {
  const {
    compare = false,
    compareSplit = 50,
    scale = 1,
    matte = 'transparent',
  } = options
  const ctx = canvas.getContext('2d')
  const { width: baseWidth, height: baseHeight, sourceRatio } = getCanvasSize(image, settings.cropRatio)
  const width = Math.max(1, Math.round(baseWidth * scale))
  const height = Math.max(1, Math.round(baseHeight * scale))

  canvas.width = width
  canvas.height = height
  ctx.clearRect(0, 0, width, height)
  if (matte !== 'transparent') {
    ctx.fillStyle = matte
    ctx.fillRect(0, 0, width, height)
  }

  drawBase(ctx, image, settings, width, height, sourceRatio, true)
  applyPixelAdjustments(ctx, settings, width, height)
  applyOverlays(ctx, settings, width, height)
  applyRetouch(ctx, settings, width, height)
  applyMask(ctx, settings, width, height)

  if (compare) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, width * (compareSplit / 100), height)
    ctx.clip()
    drawBase(ctx, image, {
      ...DEFAULT_SETTINGS,
      cropZoom: settings.cropZoom,
      cropX: settings.cropX,
      cropY: settings.cropY,
      rotate: settings.rotate,
      flipX: settings.flipX,
      flipY: settings.flipY,
    }, width, height, sourceRatio, false)
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = Math.max(2, width * 0.002)
    const markerX = width * (compareSplit / 100)
    ctx.beginPath()
    ctx.moveTo(markerX, 0)
    ctx.lineTo(markerX, height)
    ctx.stroke()
    ctx.restore()
  }

  return { width, height, sourceRatio }
}

function Vibes() {
  const bgRef = useBgFit('/backgrounds/gallery-bg.jpg')
  const canvasRef = useRef(null)
  const canvasFrameRef = useRef(null)
  const fileInputRef = useRef(null)

  const [workspaceItems, setWorkspaceItems] = useState(() => INITIAL_WORKSPACE_ITEMS)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(DEFAULT_WORKSPACE_ITEM.id)
  const [source, setSource] = useState({
    src: DEFAULT_WORKSPACE_ITEM.src,
    name: DEFAULT_WORKSPACE_ITEM.name,
    local: DEFAULT_WORKSPACE_ITEM.local,
  })
  const [imageEl, setImageEl] = useState(null)
  const [settings, setSettings] = useState(() => cloneSettings(DEFAULT_WORKSPACE_ITEM.settings))
  const [history, setHistory] = useState(() => normalizeHistoryEntries(DEFAULT_WORKSPACE_ITEM.history, DEFAULT_WORKSPACE_ITEM.settings))
  const [historyIndex, setHistoryIndex] = useState(DEFAULT_WORKSPACE_ITEM.historyIndex)
  const historyIndexRef = useRef(DEFAULT_WORKSPACE_ITEM.historyIndex)
  const pendingSliderRef = useRef(null)
  const cropDragRef = useRef(null)
  const [activeTool, setActiveTool] = useState('adjust')
  const [activeGroup, setActiveGroup] = useState('light')
  const [activeHslChannel, setActiveHslChannel] = useState('red')
  const [compare, setCompare] = useState(false)
  const [compareSplit, setCompareSplit] = useState(50)
  const [compareOverlay, setCompareOverlay] = useState(null)
  const [viewZoom, setViewZoom] = useState(100)
  const [exportType, setExportType] = useState('image/png')
  const [exportScale, setExportScale] = useState(1)
  const [exportQuality, setExportQuality] = useState(94)
  const [exportMatte, setExportMatte] = useState('transparent')
  const [exportName, setExportName] = useState(DEFAULT_WORKSPACE_ITEM.exportName)
  const [presetIntensity, setPresetIntensity] = useState(100)
  const [status, setStatus] = useState('Ready')

  const activeControls = useMemo(
    () => ADJUSTMENT_GROUPS.find((group) => group.id === activeGroup) || ADJUSTMENT_GROUPS[0],
    [activeGroup]
  )

  const renderedSize = useMemo(() => {
    if (!imageEl) return null
    return getCanvasSize(imageEl, settings.cropRatio)
  }, [imageEl, settings.cropRatio])

  const sourceStats = useMemo(() => {
    if (!imageEl) return null
    return {
      width: imageEl.naturalWidth,
      height: imageEl.naturalHeight,
      megapixels: ((imageEl.naturalWidth * imageEl.naturalHeight) / 1000000).toFixed(1),
      ratio: (imageEl.naturalWidth / imageEl.naturalHeight).toFixed(2),
    }
  }, [imageEl])

  const activeLayerCount = useMemo(
    () => LAYER_STACK.filter((layer) => settings[layer.key]).length,
    [settings]
  )

  const updateCompareOverlay = useCallback(() => {
    const frame = canvasFrameRef.current
    const canvas = canvasRef.current

    if (!frame || !canvas) {
      setCompareOverlay(null)
      return
    }

    const frameRect = frame.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()
    const next = {
      left: canvasRect.left - frameRect.left + frame.scrollLeft,
      top: canvasRect.top - frameRect.top + frame.scrollTop,
      width: canvasRect.width,
      height: canvasRect.height,
    }

    setCompareOverlay((current) => {
      if (
        current &&
        Math.abs(current.left - next.left) < 0.5 &&
        Math.abs(current.top - next.top) < 0.5 &&
        Math.abs(current.width - next.width) < 0.5 &&
        Math.abs(current.height - next.height) < 0.5
      ) {
        return current
      }
      return next
    })
  }, [])

  const cropTravel = useMemo(() => {
    if (!imageEl) return { x: 0, y: 0 }

    const sourceRatio = imageEl.naturalWidth / imageEl.naturalHeight
    const targetRatio = getRatioValue(settings.cropRatio, sourceRatio)
    const cropRect = getCropSourceRect(imageEl, targetRatio, sourceRatio, settings.cropX, settings.cropY, settings.cropZoom)

    return {
      x: cropRect.maxSx,
      y: cropRect.maxSy,
    }
  }, [imageEl, settings.cropRatio, settings.cropX, settings.cropY, settings.cropZoom])

  const pushHistory = useCallback((nextSettings, label = 'Edit') => {
    setHistory((current) => {
      const currentIndex = historyIndexRef.current
      const trimmed = current.slice(0, currentIndex + 1)
      const last = trimmed[trimmed.length - 1]

      if (last && settingsEqual(last.settings, nextSettings)) {
        return current
      }

      const withEntry = [...trimmed, { settings: nextSettings, label }]
      const next = withEntry.length > 40
        ? [withEntry[0], ...withEntry.slice(-39)]
        : withEntry
      const nextIndex = next.length - 1

      historyIndexRef.current = nextIndex
      setHistoryIndex(nextIndex)
      return next
    })
  }, [])

  const applySettings = useCallback((updater, label) => {
    setSettings((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      pushHistory(next, label)
      return next
    })
  }, [pushHistory])

  const updateSetting = useCallback((key, value) => {
    applySettings((current) => ({ ...current, [key]: value }), HISTORY_LABELS[key] || 'Edit')
  }, [applySettings])

  const previewSetting = useCallback((key, value) => {
    setSettings((current) => (
      current[key] === value ? current : { ...current, [key]: value }
    ))
  }, [])

  const commitSetting = useCallback((key, value) => {
    setSettings((current) => {
      const next = current[key] === value ? current : { ...current, [key]: value }
      pushHistory(next, HISTORY_LABELS[key] || 'Edit')
      return next
    })
  }, [pushHistory])

  const previewSliderSetting = useCallback((key, value) => {
    pendingSliderRef.current = { key, value }
    previewSetting(key, value)
  }, [previewSetting])

  const flushSliderSetting = useCallback((key, value) => {
    pendingSliderRef.current = null
    commitSetting(key, value)
  }, [commitSetting])

  const flushPendingSlider = useCallback(() => {
    const pending = pendingSliderRef.current
    if (!pending) return

    pendingSliderRef.current = null
    commitSetting(pending.key, pending.value)
  }, [commitSetting])

  const sliderCommitProps = useCallback((key) => ({
    onPointerUp: (event) => flushSliderSetting(key, Number(event.currentTarget.value)),
    onMouseUp: (event) => flushSliderSetting(key, Number(event.currentTarget.value)),
    onTouchEnd: (event) => flushSliderSetting(key, Number(event.currentTarget.value)),
    onKeyUp: (event) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
        flushSliderSetting(key, Number(event.currentTarget.value))
      }
    },
    onBlur: (event) => flushSliderSetting(key, Number(event.currentTarget.value)),
  }), [flushSliderSetting])

  const toggleLayer = useCallback((key) => {
    applySettings((current) => ({ ...current, [key]: !current[key] }), HISTORY_LABELS[key] || 'Layer')
  }, [applySettings])

  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImageEl(img)
      setStatus(`${source.name} loaded`)
    }
    img.onerror = () => setStatus('Image failed to load')
    img.src = source.src
  }, [source])

  useEffect(() => {
    if (!imageEl || !canvasRef.current) return

    const canvas = canvasRef.current
    renderEditedCanvas(canvas, imageEl, settings, { compare, compareSplit })
  }, [compare, compareSplit, imageEl, settings])

  useEffect(() => {
    setWorkspaceItems((items) => items.map((item) => (
      item.id === activeWorkspaceId
        ? {
            ...item,
            src: source.src,
            name: source.name,
            local: source.local,
            settings,
            history,
            historyIndex,
            exportName,
          }
        : item
    )))
  }, [activeWorkspaceId, exportName, history, historyIndex, settings, source.local, source.name, source.src])

  useEffect(() => {
    if (!compare || !imageEl) {
      setCompareOverlay(null)
      return undefined
    }

    const frame = canvasFrameRef.current
    const canvas = canvasRef.current
    if (!frame || !canvas) return undefined

    let animationFrame = 0
    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(updateCompareOverlay)
    }

    scheduleUpdate()

    const Observer = window.ResizeObserver
    const resizeObserver = Observer ? new Observer(scheduleUpdate) : null
    resizeObserver?.observe(frame)
    resizeObserver?.observe(canvas)
    frame.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver?.disconnect()
      frame.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [compare, imageEl, renderedSize?.height, renderedSize?.width, updateCompareOverlay, viewZoom])

  useEffect(() => {
    window.addEventListener('pointerup', flushPendingSlider, { passive: true })
    window.addEventListener('mouseup', flushPendingSlider, { passive: true })
    window.addEventListener('touchend', flushPendingSlider, { passive: true })

    return () => {
      window.removeEventListener('pointerup', flushPendingSlider)
      window.removeEventListener('mouseup', flushPendingSlider)
      window.removeEventListener('touchend', flushPendingSlider)
    }
  }, [flushPendingSlider])

  const openWorkspaceItem = useCallback((item, statusMessage = 'Loading image') => {
    const nextSettings = cloneSettings(item.settings)
    const nextHistory = normalizeHistoryEntries(item.history, nextSettings)
    const nextHistoryIndex = clamp(Number(item.historyIndex) || 0, 0, nextHistory.length - 1)

    setActiveWorkspaceId(item.id)
    setSource({ src: item.src, name: item.name, local: item.local })
    setSettings(nextHistory[nextHistoryIndex]?.settings || nextSettings)
    setHistory(nextHistory)
    historyIndexRef.current = nextHistoryIndex
    setHistoryIndex(nextHistoryIndex)
    setCompare(false)
    setCompareSplit(50)
    setViewZoom(100)
    setActiveHslChannel('red')
    setPresetIntensity(100)
    setExportName(item.exportName || createSafeExportName(item.name))
    setStatus(statusMessage)
  }, [])

  const selectWorkspaceItem = useCallback((itemId) => {
    const item = workspaceItems.find((candidate) => candidate.id === itemId)
    if (!item) return
    if (item.id === activeWorkspaceId) {
      setStatus(item.name)
      return
    }

    openWorkspaceItem(item)
  }, [activeWorkspaceId, openWorkspaceItem, workspaceItems])

  const importImageFiles = useCallback(async (files) => {
    const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      setStatus('Choose image files')
      return
    }

    setStatus('Importing photos')

    try {
      const importedItems = await Promise.all(imageFiles.map(async (file, index) => createWorkspaceItem({
        id: `local-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        src: await readFileAsDataUrl(file),
        name: file.name,
        local: true,
        settings: DEFAULT_SETTINGS,
        history: createOriginalHistory(DEFAULT_SETTINGS),
        historyIndex: 0,
        exportName: createSafeExportName(file.name),
      })))

      setWorkspaceItems((items) => [...items, ...importedItems])
      openWorkspaceItem(importedItems[0], `Imported ${importedItems.length} photo${importedItems.length === 1 ? '' : 's'}`)
    } catch {
      setStatus('Import failed')
    }
  }, [openWorkspaceItem])

  const importWorkspaceFile = useCallback(async (file) => {
    setStatus('Importing workspace')

    try {
      const text = await readFileAsText(file)
      const parsed = JSON.parse(text)
      const rawItems = Array.isArray(parsed?.items) ? parsed.items : []
      const importedItems = rawItems
        .map(normalizeWorkspaceItem)
        .filter(Boolean)

      if (parsed?.app !== WORKSPACE_APP_ID || parsed?.version > WORKSPACE_VERSION || importedItems.length === 0) {
        setStatus('Workspace file not valid')
        return
      }

      const activeItem = importedItems.find((item) => item.id === parsed.activeId) || importedItems[0]
      setWorkspaceItems(importedItems)
      setExportType(parsed.export?.type === 'image/jpeg' ? 'image/jpeg' : 'image/png')
      setExportScale([1, 2, 3].includes(parsed.export?.scale) ? parsed.export.scale : 1)
      setExportQuality(clamp(Number(parsed.export?.quality) || 94, 40, 100))
      setExportMatte(typeof parsed.export?.matte === 'string' ? parsed.export.matte : 'transparent')
      openWorkspaceItem(activeItem, `Workspace loaded · ${importedItems.length} photo${importedItems.length === 1 ? '' : 's'}`)
    } catch {
      setStatus('Workspace import failed')
    }
  }, [openWorkspaceItem])

  const handleFiles = useCallback((files) => {
    const fileList = Array.from(files || [])
    if (fileList.length === 0) return

    const workspaceFile = fileList.find(isWorkspaceFile)
    if (workspaceFile) {
      importWorkspaceFile(workspaceFile)
      return
    }

    importImageFiles(fileList)
  }, [importImageFiles, importWorkspaceFile])

  const handleDrop = useCallback((event) => {
    event.preventDefault()
    handleFiles(event.dataTransfer.files)
  }, [handleFiles])

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return
    const nextIndex = historyIndex - 1
    historyIndexRef.current = nextIndex
    setHistoryIndex(nextIndex)
    setSettings(history[nextIndex].settings)
    setStatus('Undo')
  }, [history, historyIndex])

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const nextIndex = historyIndex + 1
    historyIndexRef.current = nextIndex
    setHistoryIndex(nextIndex)
    setSettings(history[nextIndex].settings)
    setStatus('Redo')
  }, [history, historyIndex])

  const handleReset = useCallback(() => {
    const resetSettings = cloneSettings(DEFAULT_SETTINGS)
    setSettings(resetSettings)
    setHistory(createOriginalHistory(resetSettings))
    historyIndexRef.current = 0
    setHistoryIndex(0)
    setCompare(false)
    setStatus('Reset')
  }, [])

  const selectHistoryEntry = useCallback((index) => {
    const item = history[index]
    if (!item) return

    historyIndexRef.current = index
    setHistoryIndex(index)
    setSettings(item.settings)
    setStatus(item.label)
  }, [history])

  const deleteHistoryEntry = useCallback((deleteIndex) => {
    if (deleteIndex === 0) {
      setStatus('Original stays as baseline')
      return
    }

    setHistory((current) => {
      if (deleteIndex < 1 || deleteIndex >= current.length) return current

      const next = current.filter((_, index) => index !== deleteIndex)
      const currentIndex = historyIndexRef.current
      let nextIndex = currentIndex
      if (deleteIndex < currentIndex) nextIndex = currentIndex - 1
      if (deleteIndex === currentIndex) nextIndex = Math.max(0, deleteIndex - 1)
      nextIndex = clamp(nextIndex, 0, next.length - 1)

      historyIndexRef.current = nextIndex
      setHistoryIndex(nextIndex)
      setSettings(next[nextIndex].settings)
      setStatus(`${current[deleteIndex].label} deleted`)
      return next
    })
  }, [])

  const applyPreset = useCallback((preset) => {
    applySettings((current) => {
      const intensity = presetIntensity / 100
      return Object.entries(preset.settings).reduce((next, [key, value]) => ({
        ...next,
        [key]: typeof value === 'number'
          ? Math.round(current[key] + (value - current[key]) * intensity)
          : value,
      }), current)
    }, preset.label)
    setStatus(`${preset.label} applied at ${presetIntensity}%`)
  }, [applySettings, presetIntensity])

  const rotateBy = useCallback((degrees) => {
    applySettings((current) => ({ ...current, rotate: normalizeDegrees(current.rotate + degrees) }), 'Rotate')
  }, [applySettings])

  const handleCropPointerDown = useCallback((event) => {
    if (activeTool !== 'crop' || !imageEl || event.button > 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    cropDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startCropX: settings.cropX,
      startCropY: settings.cropY,
      latestCropX: settings.cropX,
      latestCropY: settings.cropY,
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
      canMoveX: cropTravel.x > 0,
      canMoveY: cropTravel.y > 0,
    }

    canvas.setPointerCapture?.(event.pointerId)
    event.preventDefault()
    setStatus('Crop positioning')
  }, [activeTool, cropTravel.x, cropTravel.y, imageEl, settings.cropX, settings.cropY])

  const handleCropPointerMove = useCallback((event) => {
    const drag = cropDragRef.current
    if (!drag) return

    const nextCropX = drag.canMoveX
      ? clamp(drag.startCropX + (((event.clientX - drag.startX) / drag.width) * 200), -100, 100)
      : drag.startCropX
    const nextCropY = drag.canMoveY
      ? clamp(drag.startCropY + (((event.clientY - drag.startY) / drag.height) * 200), -100, 100)
      : drag.startCropY

    drag.latestCropX = Math.round(nextCropX)
    drag.latestCropY = Math.round(nextCropY)

    setSettings((current) => (
      current.cropX === drag.latestCropX && current.cropY === drag.latestCropY
        ? current
        : { ...current, cropX: drag.latestCropX, cropY: drag.latestCropY }
    ))
    event.preventDefault()
  }, [])

  const finishCropDrag = useCallback((event) => {
    const drag = cropDragRef.current
    if (!drag) return

    cropDragRef.current = null
    if (canvasRef.current?.hasPointerCapture?.(drag.pointerId)) {
      canvasRef.current.releasePointerCapture(drag.pointerId)
    }
    applySettings((current) => ({
      ...current,
      cropX: drag.latestCropX,
      cropY: drag.latestCropY,
    }), 'Crop Position')
    setStatus('Crop position set')
    event?.preventDefault?.()
  }, [applySettings])

  const handleSaveWorkspace = useCallback(() => {
    const syncedItems = workspaceItems.map((item) => (
      item.id === activeWorkspaceId
        ? {
            ...item,
            src: source.src,
            name: source.name,
            local: source.local,
            settings,
            history,
            historyIndex,
            exportName,
          }
        : item
    ))
    const workspace = {
      app: WORKSPACE_APP_ID,
      version: WORKSPACE_VERSION,
      savedAt: new Date().toISOString(),
      activeId: activeWorkspaceId,
      export: {
        type: exportType,
        scale: exportScale,
        quality: exportQuality,
        matte: exportMatte,
      },
      items: syncedItems,
    }
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${createSafeExportName(source.name, 'vibes-workspace')}-workspace.skyevibes`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setStatus(`Workspace saved · ${syncedItems.length} photo${syncedItems.length === 1 ? '' : 's'}`)
  }, [
    activeWorkspaceId,
    exportMatte,
    exportQuality,
    exportScale,
    exportType,
    exportName,
    history,
    historyIndex,
    settings,
    source.local,
    source.name,
    source.src,
    workspaceItems,
  ])

  const handleExport = useCallback(() => {
    if (!imageEl) return

    const canvas = document.createElement('canvas')
    renderEditedCanvas(canvas, imageEl, settings, {
      scale: exportScale,
      matte: exportType === 'image/jpeg' && exportMatte === 'transparent' ? '#050505' : exportMatte,
    })

    const extension = exportType === 'image/jpeg' ? 'jpg' : 'png'
    const quality = exportType === 'image/jpeg' ? exportQuality / 100 : undefined
    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed')
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const safeName = (exportName || source.name).replace(/\.[^.]+$/, '').replace(/[^a-z0-9-]+/gi, '-').toLowerCase()
      link.download = `${safeName}.${extension}`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setStatus(`Exported ${extension.toUpperCase()} at ${exportScale}x`)
    }, exportType, quality)
  }, [exportMatte, exportName, exportQuality, exportScale, exportType, imageEl, settings, source.name])

  const canvasLabel = renderedSize
    ? `${renderedSize.width} x ${renderedSize.height} · ${activeLayerCount}/${LAYER_STACK.length} layers`
    : 'No canvas'

  return (
    <div
      ref={bgRef}
      className="page-container vibes-page"
      style={{ '--bg-image': 'url(/backgrounds/gallery-bg.jpg)' }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.skyevibes,application/json"
        multiple
        className="vibes-file-input"
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
      />

      <section className="vibes-editor">
        <aside className="vibes-tool-rail" aria-label="Vibes tools">
          <div className="vibes-rail-mark">VB</div>
          {TOOL_MODES.map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.id}
                type="button"
                className={`vibes-tool-btn ${activeTool === tool.id ? 'active' : ''}`}
                onClick={() => setActiveTool(tool.id)}
                title={tool.label}
                aria-label={tool.label}
              >
                <Icon size={19} />
              </button>
            )
          })}
        </aside>

        <div className="vibes-workspace">
          <header className="vibes-command-bar">
            <div>
              <h1>VIBES</h1>
              <span>{source.local ? 'Local file' : 'Gallery sample'} · {workspaceItems.length} photo{workspaceItems.length === 1 ? '' : 's'} · {canvasLabel}</span>
            </div>
            <div className="vibes-command-actions">
              <button type="button" className="vibes-command" onClick={() => fileInputRef.current?.click()}>
                <Upload size={17} /> Import
              </button>
              <button type="button" className="vibes-command" onClick={handleSaveWorkspace}>
                <Download size={17} /> Save Workspace
              </button>
              <button type="button" className="vibes-icon-command" onClick={handleUndo} disabled={historyIndex <= 0} title="Undo">
                <Undo2 size={17} />
              </button>
              <button type="button" className="vibes-icon-command" onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo">
                <Redo2 size={17} />
              </button>
              <button type="button" className="vibes-icon-command" onClick={handleReset} title="Reset">
                <RotateCcw size={17} />
              </button>
              <button type="button" className={`vibes-command ${compare ? 'active' : ''}`} onClick={() => setCompare((value) => !value)}>
                <Eye size={17} /> Compare
              </button>
              <button type="button" className="vibes-command primary" onClick={handleExport}>
                <Download size={17} /> Export
              </button>
            </div>
          </header>

          <div className="vibes-main-stage">
            <div className="vibes-canvas-shell">
              <div className="vibes-canvas-meta">
                <span>{status}</span>
                <span>{Math.round(viewZoom)}%</span>
              </div>
              <div className="vibes-canvas-frame" ref={canvasFrameRef}>
                <canvas
                  ref={canvasRef}
                  className={`vibes-canvas ${activeTool === 'crop' ? 'crop-active' : ''}`}
                  style={{ transform: `scale(${viewZoom / 100})` }}
                  onPointerDown={handleCropPointerDown}
                  onPointerMove={handleCropPointerMove}
                  onPointerUp={finishCropDrag}
                  onPointerCancel={finishCropDrag}
                />
                {!imageEl && (
                  <div className="vibes-empty-canvas">
                    <ImageIcon size={44} />
                    <span>Drop an image</span>
                  </div>
                )}
                {compare && compareOverlay && (
                  <div
                    className={`vibes-compare-overlay ${compareOverlay.width < 220 ? 'compact' : ''}`}
                    style={{
                      '--compare-split': `${compareSplit}%`,
                      left: `${compareOverlay.left}px`,
                      top: `${compareOverlay.top}px`,
                      width: `${compareOverlay.width}px`,
                      height: `${compareOverlay.height}px`,
                    }}
                  >
                    <span className="vibes-compare-tag original">Original</span>
                    <span className="vibes-compare-tag edited">Edited</span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={compareSplit}
                      onInput={(event) => setCompareSplit(Number(event.currentTarget.value))}
                      onChange={(event) => setCompareSplit(Number(event.target.value))}
                      aria-label="Compare slider"
                      className="vibes-compare-slider"
                    />
                    <span className="vibes-compare-handle" aria-hidden="true">
                      <SlidersHorizontal size={16} />
                    </span>
                  </div>
                )}
              </div>
              <div className="vibes-zoom-bar">
                <button type="button" onClick={() => setViewZoom((value) => clamp(value - 10, 25, 200))} title="Zoom out">
                  <ZoomOut size={16} />
                </button>
                <input
                  type="range"
                  min="25"
                  max="200"
                  value={viewZoom}
                  onChange={(event) => setViewZoom(Number(event.target.value))}
                  aria-label="Preview zoom"
                />
                <button type="button" onClick={() => setViewZoom((value) => clamp(value + 10, 25, 200))} title="Zoom in">
                  <ZoomIn size={16} />
                </button>
                {compare && (
                  <label className="vibes-compare-range">
                    <span>
                      Compare
                      <strong>{compareSplit}%</strong>
                    </span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={compareSplit}
                      onInput={(event) => setCompareSplit(Number(event.currentTarget.value))}
                      onChange={(event) => setCompareSplit(Number(event.target.value))}
                      aria-label="Compare split"
                    />
                  </label>
                )}
              </div>
            </div>

            <aside className="vibes-inspector">
              <div className="vibes-panel-head">
                <span>{TOOL_MODES.find((tool) => tool.id === activeTool)?.label}</span>
                <Sparkles size={17} />
              </div>

              {activeTool === 'adjust' && (
                <>
                  <div className="vibes-tabs">
                    {ADJUSTMENT_GROUPS.map((group) => {
                      const Icon = group.icon
                      return (
                        <button
                          key={group.id}
                          type="button"
                          className={activeGroup === group.id ? 'active' : ''}
                          onClick={() => setActiveGroup(group.id)}
                        >
                          <Icon size={15} /> {group.title}
                        </button>
                      )
                    })}
                  </div>
                  <div className="vibes-control-list">
                    {activeControls.controls.map((control) => (
                      <label key={control.key} className="vibes-slider-row">
                        <span>
                          {control.label}
                          <strong>{settings[control.key]}</strong>
                        </span>
                        <input
                          type="range"
                          min={control.min}
                          max={control.max}
                          value={settings[control.key]}
                          onInput={(event) => previewSliderSetting(control.key, Number(event.currentTarget.value))}
                          onChange={(event) => previewSliderSetting(control.key, Number(event.target.value))}
                          {...sliderCommitProps(control.key)}
                        />
                      </label>
                    ))}
                  </div>
                </>
              )}

              {activeTool === 'hsl' && (
                <div className="vibes-channel-panel">
                  <div className="vibes-swatch-grid">
                    {HSL_CHANNELS.map((channel) => (
                      <button
                        key={channel.id}
                        type="button"
                        className={activeHslChannel === channel.id ? 'active' : ''}
                        onClick={() => setActiveHslChannel(channel.id)}
                        title={channel.label}
                      >
                        <span style={{ '--swatch': channel.swatch }} />
                        {channel.label}
                      </button>
                    ))}
                  </div>
                  {[
                    { key: `${activeHslChannel}Hue`, label: 'Hue', min: -180, max: 180 },
                    { key: `${activeHslChannel}Sat`, label: 'Saturation', min: -100, max: 100 },
                    { key: `${activeHslChannel}Lum`, label: 'Luminance', min: -100, max: 100 },
                  ].map((control) => (
                    <label key={control.key} className="vibes-slider-row">
                      <span>
                        {control.label}
                        <strong>{settings[control.key]}</strong>
                      </span>
                      <input
                        type="range"
                        min={control.min}
                        max={control.max}
                        value={settings[control.key]}
                        onInput={(event) => previewSliderSetting(control.key, Number(event.currentTarget.value))}
                        onChange={(event) => previewSliderSetting(control.key, Number(event.target.value))}
                        {...sliderCommitProps(control.key)}
                      />
                    </label>
                  ))}
                </div>
              )}

              {activeTool === 'curve' && (
                <div className="vibes-curve-panel">
                  <div className="vibes-curve-preview" aria-hidden="true">
                    <svg viewBox="0 0 120 80" role="img">
                      <path d="M8 70 C 32 62, 42 48, 60 40 S 92 20, 112 10" />
                      <circle cx={18 + settings.curveShadows * 0.08} cy={60 - settings.curveShadows * 0.16} r="3" />
                      <circle cx="58" cy={40 - settings.curveMidtones * 0.16} r="3" />
                      <circle cx="92" cy={24 - settings.curveHighlights * 0.12} r="3" />
                    </svg>
                  </div>
                  <div className="vibes-control-list compact">
                    {CURVE_CONTROLS.map((control) => (
                      <label key={control.key} className="vibes-slider-row">
                        <span>
                          {control.label}
                          <strong>{settings[control.key]}</strong>
                        </span>
                        <input
                          type="range"
                          min={control.min}
                          max={control.max}
                          value={settings[control.key]}
                          onInput={(event) => previewSliderSetting(control.key, Number(event.currentTarget.value))}
                          onChange={(event) => previewSliderSetting(control.key, Number(event.target.value))}
                          {...sliderCommitProps(control.key)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'grade' && (
                <div className="vibes-grade-panel">
                  <div className="vibes-grade-strip" aria-hidden="true">
                    <span style={{ '--grade': hslColor(settings.gradeShadowHue, settings.gradeShadowSat || 12, 34) }} />
                    <span style={{ '--grade': hslColor(settings.gradeMidHue, settings.gradeMidSat || 12, 50) }} />
                    <span style={{ '--grade': hslColor(settings.gradeHighlightHue, settings.gradeHighlightSat || 12, 64) }} />
                  </div>
                  <div className="vibes-control-list compact">
                    {GRADING_CONTROLS.map((control) => (
                      <label key={control.key} className="vibes-slider-row">
                        <span>
                          {control.label}
                          <strong>{settings[control.key]}</strong>
                        </span>
                        <input
                          type="range"
                          min={control.min}
                          max={control.max}
                          value={settings[control.key]}
                          onInput={(event) => previewSliderSetting(control.key, Number(event.currentTarget.value))}
                          onChange={(event) => previewSliderSetting(control.key, Number(event.target.value))}
                          {...sliderCommitProps(control.key)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'mask' && (
                <div className="vibes-mask-panel">
                  <div className="vibes-ratio-grid">
                    {MASK_TYPES.map((mask) => (
                      <button
                        key={mask.id}
                        type="button"
                        className={settings.maskType === mask.id ? 'active' : ''}
                        onClick={() => updateSetting('maskType', mask.id)}
                      >
                        {mask.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={`vibes-toggle-row ${settings.maskInvert ? 'active' : ''}`}
                    onClick={() => updateSetting('maskInvert', !settings.maskInvert)}
                  >
                    <SlidersVertical size={16} />
                    Invert Mask
                  </button>
                  <div className="vibes-control-list compact">
                    {MASK_CONTROLS.map((control) => (
                      <label key={control.key} className="vibes-slider-row">
                        <span>
                          {control.label}
                          <strong>{settings[control.key]}</strong>
                        </span>
                        <input
                          type="range"
                          min={control.min}
                          max={control.max}
                          value={settings[control.key]}
                          onInput={(event) => previewSliderSetting(control.key, Number(event.currentTarget.value))}
                          onChange={(event) => previewSliderSetting(control.key, Number(event.target.value))}
                          {...sliderCommitProps(control.key)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'retouch' && (
                <div className="vibes-retouch-panel">
                  <div className="vibes-ratio-grid">
                    {TOUCHUP_ZONES.map((zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        className={settings.touchupZone === zone.id ? 'active' : ''}
                        onClick={() => updateSetting('touchupZone', zone.id)}
                      >
                        {zone.label}
                      </button>
                    ))}
                  </div>
                  <div className="vibes-control-list compact">
                    {TOUCHUP_CONTROLS.map((control) => (
                      <label key={control.key} className="vibes-slider-row">
                        <span>
                          {control.label}
                          <strong>{settings[control.key]}</strong>
                        </span>
                        <input
                          type="range"
                          min={control.min}
                          max={control.max}
                          value={settings[control.key]}
                          onInput={(event) => previewSliderSetting(control.key, Number(event.currentTarget.value))}
                          onChange={(event) => previewSliderSetting(control.key, Number(event.target.value))}
                          {...sliderCommitProps(control.key)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'presets' && (
                <>
                  <div className="vibes-preset-toolbar">
                    <label className="vibes-slider-row">
                      <span>
                        Intensity
                        <strong>{presetIntensity}</strong>
                      </span>
                      <input
                        type="range"
                        min="10"
                        max="150"
                        value={presetIntensity}
                        onChange={(event) => setPresetIntensity(Number(event.target.value))}
                      />
                    </label>
                  </div>
                  <div className="vibes-preset-grid">
                    {PRESETS.map((preset) => (
                      <button key={preset.id} type="button" onClick={() => applyPreset(preset)}>
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {activeTool === 'crop' && (
                <div className="vibes-transform-panel">
                  <div className="vibes-ratio-grid">
                    {CROP_RATIOS.map((ratio) => (
                      <button
                        key={ratio.id}
                        type="button"
                        className={settings.cropRatio === ratio.id ? 'active' : ''}
                        onClick={() => updateSetting('cropRatio', ratio.id)}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                  <div className="vibes-transform-buttons">
                    <button type="button" onClick={() => rotateBy(-90)}><RotateCcw size={17} /> Left</button>
                    <button type="button" onClick={() => rotateBy(90)}><RotateCw size={17} /> Right</button>
                    <button type="button" onClick={() => updateSetting('flipX', !settings.flipX)}><FlipHorizontal size={17} /> Flip X</button>
                    <button type="button" onClick={() => updateSetting('flipY', !settings.flipY)}><FlipVertical size={17} /> Flip Y</button>
                  </div>
                  <label className="vibes-slider-row">
                    <span>
                      Straighten
                      <strong>{settings.rotate}</strong>
                    </span>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      value={settings.rotate}
                      onInput={(event) => previewSliderSetting('rotate', Number(event.currentTarget.value))}
                      onChange={(event) => previewSliderSetting('rotate', Number(event.target.value))}
                      {...sliderCommitProps('rotate')}
                    />
                  </label>
                  <div className="vibes-crop-position">
                    <label className="vibes-slider-row">
                      <span>
                        Scale
                        <strong>{100 + settings.cropZoom}%</strong>
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={settings.cropZoom}
                        onInput={(event) => previewSliderSetting('cropZoom', Number(event.currentTarget.value))}
                        onChange={(event) => previewSliderSetting('cropZoom', Number(event.target.value))}
                        {...sliderCommitProps('cropZoom')}
                      />
                    </label>
                    <label className="vibes-slider-row">
                      <span>
                        Position X
                        <strong>{settings.cropX}</strong>
                      </span>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={settings.cropX}
                        disabled={cropTravel.x <= 0}
                        onInput={(event) => previewSliderSetting('cropX', Number(event.currentTarget.value))}
                        onChange={(event) => previewSliderSetting('cropX', Number(event.target.value))}
                        {...sliderCommitProps('cropX')}
                      />
                    </label>
                    <label className="vibes-slider-row">
                      <span>
                        Position Y
                        <strong>{settings.cropY}</strong>
                      </span>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={settings.cropY}
                        disabled={cropTravel.y <= 0}
                        onInput={(event) => previewSliderSetting('cropY', Number(event.currentTarget.value))}
                        onChange={(event) => previewSliderSetting('cropY', Number(event.target.value))}
                        {...sliderCommitProps('cropY')}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    className="vibes-toggle-row"
                    onClick={() => applySettings((current) => ({ ...current, cropX: 0, cropY: 0 }), 'Crop Position')}
                  >
                    <Focus size={16} />
                    Center Crop
                  </button>
                </div>
              )}

              {activeTool === 'layers' && (
                <div className="vibes-layer-panel">
                  {LAYER_STACK.map((layer) => (
                    <div
                      key={layer.key}
                      role="button"
                      tabIndex={0}
                      className={`vibes-layer-row ${settings[layer.key] ? 'active' : ''}`}
                      onClick={() => toggleLayer(layer.key)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          toggleLayer(layer.key)
                        }
                      }}
                    >
                      <span>
                        <strong>{layer.label}</strong>
                        <em>{layer.detail}</em>
                      </span>
                      <i>{settings[layer.key] ? 'On' : 'Off'}</i>
                    </div>
                  ))}
                </div>
              )}

              {activeTool === 'info' && (
                <div className="vibes-info-panel">
                  <div className="vibes-info-grid">
                    <span>Source</span>
                    <strong>{source.local ? 'Local' : 'Gallery'}</strong>
                    <span>Original</span>
                    <strong>{sourceStats ? `${sourceStats.width} x ${sourceStats.height}` : 'Loading'}</strong>
                    <span>Canvas</span>
                    <strong>{renderedSize ? `${renderedSize.width} x ${renderedSize.height}` : 'Loading'}</strong>
                    <span>Megapixels</span>
                    <strong>{sourceStats ? `${sourceStats.megapixels} MP` : 'Loading'}</strong>
                    <span>Ratio</span>
                    <strong>{sourceStats?.ratio || 'Loading'}</strong>
                    <span>Workspace</span>
                    <strong>{workspaceItems.length} photo{workspaceItems.length === 1 ? '' : 's'}</strong>
                    <span>History</span>
                    <strong>{history.length} states</strong>
                    <span>Layers</span>
                    <strong>{activeLayerCount}/{LAYER_STACK.length} active</strong>
                  </div>
                  <div className="vibes-histogram" aria-hidden="true">
                    {Array.from({ length: 32 }, (_, index) => (
                      <span
                        key={index}
                        style={{
                          '--bar': `${20 + ((index * 17 + historyIndex * 13 + activeLayerCount * 9) % 68)}%`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'export' && (
                <div className="vibes-export-panel">
                  <div className="vibes-workspace-actions">
                    <button type="button" onClick={handleSaveWorkspace}>
                      <Download size={16} /> Save Workspace
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={16} /> Import Workspace
                    </button>
                  </div>
                  <label className="vibes-export-name">
                    File name
                    <input
                      type="text"
                      value={exportName}
                      onChange={(event) => setExportName(event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className={exportType === 'image/png' ? 'active' : ''}
                    onClick={() => setExportType('image/png')}
                  >
                    PNG
                  </button>
                  <button
                    type="button"
                    className={exportType === 'image/jpeg' ? 'active' : ''}
                    onClick={() => setExportType('image/jpeg')}
                  >
                    JPEG
                  </button>
                  <label className="vibes-slider-row">
                    <span>
                      JPEG Quality
                      <strong>{exportQuality}</strong>
                    </span>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      value={exportQuality}
                      onChange={(event) => setExportQuality(Number(event.target.value))}
                    />
                  </label>
                  <div className="vibes-export-options">
                    {[1, 2, 3].map((scale) => (
                      <button
                        key={scale}
                        type="button"
                        className={exportScale === scale ? 'active' : ''}
                        onClick={() => setExportScale(scale)}
                      >
                        {scale}x
                      </button>
                    ))}
                  </div>
                  <div className="vibes-export-options">
                    {[
                      ['transparent', 'Alpha'],
                      ['#050505', 'Black'],
                      ['#ffffff', 'White'],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={exportMatte === value ? 'active' : ''}
                        onClick={() => setExportMatte(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="vibes-export-now" onClick={handleExport}>
                    <Download size={17} /> Download edited file
                  </button>
                </div>
              )}

              <div className="vibes-history">
                <div className="vibes-history-head">
                  <span>History</span>
                  <button type="button" onClick={handleReset} title="Clear edits">
                    <X size={14} />
                  </button>
                </div>
                <div className="vibes-history-list">
                  {history.map((item, index) => (
                    <div
                      key={`${item.label}-${index}`}
                      role="button"
                      tabIndex={0}
                      className={index === historyIndex ? 'active' : ''}
                      onClick={() => selectHistoryEntry(index)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          selectHistoryEntry(index)
                        }
                      }}
                    >
                      <span className="vibes-history-index">{index + 1}</span>
                      <strong>{item.label}</strong>
                      <button
                        type="button"
                        className="vibes-history-delete"
                        onClick={(event) => {
                          event.stopPropagation()
                          deleteHistoryEntry(index)
                        }}
                        disabled={index === 0}
                        aria-label={`Delete ${item.label}`}
                        title={index === 0 ? 'Original baseline stays' : `Delete ${item.label}`}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <footer className="vibes-filmstrip">
            <button type="button" className="vibes-import-tile" onClick={() => fileInputRef.current?.click()}>
              <Upload size={18} />
              Import
            </button>
            {workspaceItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeWorkspaceId === item.id ? 'active' : ''}
                onClick={() => selectWorkspaceItem(item.id)}
                title={`${item.name} · ${item.history?.length || 1} state${item.history?.length === 1 ? '' : 's'}`}
              >
                <img src={item.src} alt={item.name} />
              </button>
            ))}
          </footer>
        </div>
      </section>
    </div>
  )
}

export default Vibes
