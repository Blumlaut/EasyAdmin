/**
 * ICE server configuration builder for PeerJS.
 *
 * Converts server-sent ICE parameters into the PeerJSConfig format.
 */

export interface IceConfigPayload {
  stunUrls: string[]
  turnUrls: string[]
  turnUsername: string
  turnCredential: string
}

/**
 * Build a PeerJS-compatible config from server-sent ICE parameters.
 */
export function buildPeerConfig(payload: IceConfigPayload): { config: { iceServers: RTCIceServer[]; iceCandidatePoolSize: number } } {
  const servers: RTCIceServer[] = []

  // STUN servers
  for (const url of payload.stunUrls) {
    servers.push({ urls: url })
  }

  // TURN servers (if configured)
  if (payload.turnUrls.length > 0 && payload.turnUsername) {
    for (const url of payload.turnUrls) {
      servers.push({
        urls: url,
        username: payload.turnUsername,
        credential: payload.turnCredential,
      })
    }
  }

  // If no servers were configured, fall back to a public STUN
  if (servers.length === 0) {
    servers.push({ urls: 'stun:stun.l.google.com:19302' })
  }

  return {
    config: {
      iceServers: servers,
      iceCandidatePoolSize: 10,
    },
  }
}
