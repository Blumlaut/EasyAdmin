import { useCallback, useEffect, useRef, useState } from 'react'
import { callLua, on } from '../fivem'
import type {
  CPUHistoryResponse,
  CPUSnapshot,
  DiskHistoryResponse,
  DiskSnapshot,
  MemoryHistoryResponse,
  MemorySnapshot,
  MetricsRange,
  NetworkHistoryResponse,
  NetworkSnapshot,
  OSInfo,
  ProcessesResponse,
  ProcessEntry,
} from '../types'

// ============================================================
// useMetricsData
// Fetches all server metrics for a given time range.
// Returns data, loading state, and a refresh callback.
// ============================================================

interface MetricsState {
  os: OSInfo | null
  cpu: CPUSnapshot[]
  cpuCoreCount: number
  memory: MemorySnapshot[]
  memoryCurrent: MemorySnapshot | null
  disk: DiskSnapshot[]
  diskCurrent: DiskSnapshot | null
  network: NetworkSnapshot[]
  networkCurrent: NetworkSnapshot | null
  processes: ProcessesResponse | null
}

interface UseMetricsDataReturn {
  os: OSInfo | null
  cpu: CPUSnapshot[]
  cpuCoreCount: number
  memory: MemorySnapshot[]
  memoryCurrent: MemorySnapshot | null
  disk: DiskSnapshot[]
  diskCurrent: DiskSnapshot | null
  network: NetworkSnapshot[]
  networkCurrent: NetworkSnapshot | null
  processes: ProcessEntry[]
  processesTimestamp: number
  loading: boolean
  refresh: () => void
}

const initialState: MetricsState = {
  os: null,
  cpu: [],
  cpuCoreCount: 1,
  memory: [],
  memoryCurrent: null,
  disk: [],
  diskCurrent: null,
  network: [],
  networkCurrent: null,
  processes: null,
}

export function useMetricsData(range: MetricsRange): UseMetricsDataReturn {
  const [state, setState] = useState<MetricsState>(initialState)
  const [loading, setLoading] = useState(true)
  const rangeRef = useRef(range)

  // Bump a version on each fetch so stale responses are discarded
  const fetchVer = useRef(0)
  const currentVer = useRef(0)

  // Listen for OS info
  useEffect(() => {
    return on<OSInfo>('osInfo', (data) => {
      setState((prev) => ({ ...prev, os: data }))
    })
  }, [])

  // Listen for CPU history
  useEffect(() => {
    return on<CPUHistoryResponse>('cpuHistory', (data) => {
      if (currentVer.current === fetchVer.current) {
        setState((prev) => ({
          ...prev,
          cpu: data.snapshots,
          cpuCoreCount: data.coreCount,
        }))
      }
    })
  }, [])

  // Listen for memory history
  useEffect(() => {
    return on<MemoryHistoryResponse>('memoryHistory', (data) => {
      if (currentVer.current === fetchVer.current) {
        setState((prev) => ({
          ...prev,
          memory: data.snapshots,
          memoryCurrent: data.current,
        }))
      }
    })
  }, [])

  // Listen for disk history
  useEffect(() => {
    return on<DiskHistoryResponse>('diskHistory', (data) => {
      if (currentVer.current === fetchVer.current) {
        setState((prev) => ({
          ...prev,
          disk: data.snapshots,
          diskCurrent: data.current,
        }))
      }
    })
  }, [])

  // Listen for network history
  useEffect(() => {
    return on<NetworkHistoryResponse>('networkHistory', (data) => {
      if (currentVer.current === fetchVer.current) {
        setState((prev) => ({
          ...prev,
          network: data.snapshots,
          networkCurrent: data.current,
        }))
      }
    })
  }, [])

  // Listen for processes
  useEffect(() => {
    return on<ProcessesResponse>('processes', (data) => {
      if (currentVer.current === fetchVer.current) {
        setState((prev) => ({ ...prev, processes: data }))
      }
    })
  }, [])

  const fetchAll = useCallback((r: MetricsRange) => {
    const ver = ++fetchVer.current
    currentVer.current = ver
    rangeRef.current = r
    setLoading(true)
    // Reset history data (keep OS info as it doesn't change)
    setState((prev) => ({
      ...initialState,
      os: prev.os,
    }))

    callLua('requestCPUHistory', { range: r }).catch(() => {})
    callLua('requestMemoryHistory', { range: r }).catch(() => {})
    callLua('requestDiskHistory', { range: r }).catch(() => {})
    callLua('requestNetworkHistory', { range: r }).catch(() => {})
    callLua('requestProcesses').catch(() => {})

    // OS info only needs to be fetched once
    if (!state.os) {
      callLua('requestOSInfo').catch(() => {})
    }
  }, [state.os])

  // Fetch on range change
  useEffect(() => {
    fetchAll(range)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  // Mark loading as false after a short delay (all responses may not arrive simultaneously)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [fetchVer.current])

  return {
    os: state.os,
    cpu: state.cpu,
    cpuCoreCount: state.cpuCoreCount,
    memory: state.memory,
    memoryCurrent: state.memoryCurrent,
    disk: state.disk,
    diskCurrent: state.diskCurrent,
    network: state.network,
    networkCurrent: state.networkCurrent,
    processes: state.processes?.processes ?? [],
    processesTimestamp: state.processes?.timestamp ?? 0,
    loading,
    refresh: () => fetchAll(range),
  }
}
