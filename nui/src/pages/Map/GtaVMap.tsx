import { useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import L from 'leaflet'
import type { Permissions, Player } from '../../types'
import { callLua } from '../../fivem'
import { I18nProvider } from '../../lib/i18n'
import { MapPlayerPopup } from './MapPlayerPopup'
import { MapTeleportPopup } from './MapTeleportPopup'
import {
  MAP_BOUNDS,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
  worldToLatLng,
  mapToGameCoords,
  scTileForLeaflet,
  scTileUrl,
  type ScStyle,
} from '../../lib/gtaMap'
import type { MapPlayer } from './MapPage'

// Slack beyond the tile grid so popups for players at the island's edge can
// auto-pan into view instead of hitting the hard maxBounds immediately.
const MAP_MARGIN = 256
const VIEW_BOUNDS: [[number, number], [number, number]] = [
  [MAP_BOUNDS[0][0] - MAP_MARGIN, MAP_BOUNDS[0][1] - MAP_MARGIN],
  [MAP_BOUNDS[1][0] + MAP_MARGIN, MAP_BOUNDS[1][1] + MAP_MARGIN],
]

interface GtaVMapProps {
  mapPlayers: MapPlayer[]
  style: ScStyle
  permissions: Permissions
  onOpenPlayer: (player: Player) => void
}

/** GridLayer that requests Social Club tiles directly (1:1 tile mapping). */
class ScTileLayer extends L.GridLayer {
  private readonly styleName: ScStyle

  constructor(styleName: ScStyle) {
    super({ minZoom: MAP_MIN_ZOOM, maxZoom: MAP_MAX_ZOOM, noWrap: true, attribution: 'Map data (c) Rockstar Games' })
    this.styleName = styleName
  }

  protected createTile(coords: L.Coords): HTMLElement {
    const tile = document.createElement('div')
    tile.className = 'ea-map-tile'
    const sc = scTileForLeaflet(coords.z, coords.x, coords.y)
    if (sc) {
      const img = document.createElement('img')
      img.src = scTileUrl(this.styleName, sc.z, sc.x, sc.y)
      img.alt = ''
      img.draggable = false
      img.onerror = () => tile.classList.add('ea-map-tile--missing')
      tile.appendChild(img)
    }
    return tile
  }
}

const SHIELD_SVG = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z"/></svg>'
const LOCK_SVG = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'

function iconSignature(p: MapPlayer): string {
  return `${p.isSelf}|${p.player.frozen}|${p.player.admin}`
}

function markerIcon(p: MapPlayer): L.DivIcon {
  let cls = 'ea-map-marker'
  let inner = ''
  if (p.isSelf) {
    cls += ' ea-map-marker--self'
  } else if (p.player.frozen) {
    cls += ' ea-map-marker--frozen'
    inner = LOCK_SVG
  } else if (p.player.admin) {
    cls += ' ea-map-marker--admin'
    inner = SHIELD_SVG
  } else {
    cls += ' ea-map-marker--normal'
  }
  return L.divIcon({
    className: 'ea-map-marker-wrap',
    html: `<div class="${cls}">${inner}</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

type PopupCtx = { p: MapPlayer; permissions: Permissions; onOpenPlayer: (player: Player) => void }

export function GtaVMap({ mapPlayers, style, permissions, onOpenPlayer }: GtaVMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<ScTileLayer | null>(null)
  const markerLayerRef = useRef<L.LayerGroup | null>(null)
  const markersRef = useRef<Map<number, L.Marker>>(new Map())
  const popupDataRef = useRef<Map<number, PopupCtx>>(new Map())
  const iconSigRef = useRef<Map<number, string>>(new Map())
  // One popup is open at a time (markers close the previous one on click).
  const popupRootRef = useRef<Root | null>(null)
  // Transient teleport popup (click-on-map). Separate from the player popup root.
  const teleportPopupRef = useRef<L.Popup | null>(null)
  const teleportPopupRootRef = useRef<Root | null>(null)

  // Ref so the map click handler (registered once) always sees current permissions.
  const permissionsRef = useRef(permissions)
  permissionsRef.current = permissions

  // --- Map lifecycle ---
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const map = L.map(el, {
      crs: L.CRS.Simple,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      zoomSnap: 1,
      maxBounds: L.latLngBounds(VIEW_BOUNDS[0], VIEW_BOUNDS[1]),
      // Hard clamp: with a viscous (rubber-band) bound, popup auto-pan near an
      // edge oscillates (pan out -> bound pulls back -> pan out -> ...).
      maxBoundsViscosity: 1,
      zoomControl: false,
    })
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    map.fitBounds(L.latLngBounds(MAP_BOUNDS[0], MAP_BOUNDS[1]), { padding: [12, 12] })
    mapRef.current = map

    // Dev-only hook for e2e tests (never set in game — FiveM NUI URLs carry no query string).
    if (new URLSearchParams(window.location.search).has('dev')) {
      const w = window as unknown as Record<string, unknown>
      w.__eaMap = map
      w.__eaL = L
    }

    // Auto-pan must only run once, when the popup opens. Leaflet runs the
    // popup's auto-pan while adding it to the map (before popupopen fires),
    // but also on every marker move — and markers move at ~2Hz. Left enabled,
    // the stream yanks the view back to the player whenever the user pans
    // away with the popup still open.
    map.on('popupopen', (e: L.PopupEvent) => {
      e.popup.options.autoPan = false
    })
    map.on('popupclose', (e: L.PopupEvent) => {
      e.popup.options.autoPan = true
      if (e.popup === teleportPopupRef.current) {
        teleportPopupRootRef.current?.unmount()
        teleportPopupRootRef.current = null
        teleportPopupRef.current = null
      } else {
        popupRootRef.current?.unmount()
        popupRootRef.current = null
      }
    })

    // Clicking empty map space (not a marker or popup) opens a teleport popup
    // at the clicked location.
    map.on('click', (e: L.LeafletMouseEvent) => {
      const target = e.originalEvent.target
      if (!(target instanceof HTMLElement)) return
      if (target.closest('.leaflet-popup, .ea-map-marker-wrap')) return
      if (!permissionsRef.current['player.teleport.single']) return

      const { x, y } = mapToGameCoords(e.latlng.lat, e.latlng.lng)
      // Leaflet auto-closes any open popup before this handler runs
      // (closePopupOnClick: true is the default).
      const el = document.createElement('div')
      // Stop clicks inside the popup from reaching the map (which would open a new teleport popup).
      el.addEventListener('click', (ev) => ev.stopPropagation())
      const root = createRoot(el)
      flushSync(() => {
        root.render(
          <I18nProvider>
            <MapTeleportPopup
              x={x}
              y={y}
              onTeleport={() => {
                map.closePopup()
                void callLua('teleportToMapCoords', { x, y }).catch(() => {})
              }}
            />
          </I18nProvider>,
        )
      })
      teleportPopupRootRef.current = root
      teleportPopupRef.current = L.popup({
        closeButton: false,
        autoPan: true,
        autoPanPadding: [12, 12],
      })
        .setLatLng(e.latlng)
        .setContent(el)
        .openOn(map)
    })

    markerLayerRef.current = L.layerGroup().addTo(map)

    const onResize = () => map.invalidateSize()
    const ro = new ResizeObserver(onResize)
    ro.observe(el)

    return () => {
      ro.disconnect()
      popupRootRef.current?.unmount()
      popupRootRef.current = null
      teleportPopupRootRef.current?.unmount()
      teleportPopupRootRef.current = null
      teleportPopupRef.current = null
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
      markerLayerRef.current = null
      markersRef.current.clear()
      popupDataRef.current.clear()
      iconSigRef.current.clear()
    }
  }, [])

  // --- Tile style ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    tileLayerRef.current?.remove()
    tileLayerRef.current = new ScTileLayer(style).addTo(map)
    tileLayerRef.current.bringToBack()
  }, [style])

  // --- Marker reconciliation (positions stream at ~2 Hz) ---
  useEffect(() => {
    const layer = markerLayerRef.current
    if (!layer) return
    const markers = markersRef.current
    const seen = new Set<number>()

    for (const p of mapPlayers) {
      seen.add(p.player.id)
      const latlng = worldToLatLng(p.pos.x, p.pos.y)
      const ctx: PopupCtx = { p, permissions, onOpenPlayer }
      popupDataRef.current.set(p.player.id, ctx)
      const existing = markers.get(p.player.id)
      if (existing) {
        existing.setLatLng(latlng)
        const sig = iconSignature(p)
        if (iconSigRef.current.get(p.player.id) !== sig) {
          existing.setIcon(markerIcon(p))
          iconSigRef.current.set(p.player.id, sig)
        }
      } else {
        const marker = L.marker(latlng, { icon: markerIcon(p), keyboard: false })
        // Leaflet re-runs the content factory on every open, so the popup
        // always renders from the freshest data through its own React root.
        marker.bindPopup(() => {
          const data = popupDataRef.current.get(p.player.id)
          if (!data) return ''
          const el = document.createElement('div')
          el.addEventListener('click', (ev) => ev.stopPropagation())
          popupRootRef.current?.unmount()
          const root = createRoot(el)
          popupRootRef.current = root
          flushSync(() => {
            root.render(
              <I18nProvider>
                <MapPlayerPopup
                  player={data.p}
                  permissions={data.permissions}
                  onSpectate={(pl) => {
                    mapRef.current?.closePopup()
                    void callLua('spectatePlayer', { id: pl.player.id }).catch(() => {})
                  }}
                  onTeleport={(pl) => {
                    mapRef.current?.closePopup()
                    void callLua('teleportToPlayer', { id: pl.player.id }).catch(() => {})
                  }}
                  onDetails={(pl) => {
                    mapRef.current?.closePopup()
                    data.onOpenPlayer(pl.player)
                  }}
                />
              </I18nProvider>,
            )
          })
          return el
        }, { closeButton: false, autoPan: true, autoPanPadding: [12, 12] })
        marker.addTo(layer)
        markers.set(p.player.id, marker)
        iconSigRef.current.set(p.player.id, iconSignature(p))
      }
    }

    for (const [id, marker] of markers) {
      if (!seen.has(id)) {
        marker.remove()
        markers.delete(id)
        popupDataRef.current.delete(id)
        iconSigRef.current.delete(id)
      }
    }
  }, [mapPlayers, permissions, onOpenPlayer])

  return <div ref={containerRef} className="ea-map" role="application" aria-label="World map" />
}
