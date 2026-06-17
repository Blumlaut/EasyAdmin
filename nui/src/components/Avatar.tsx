import { useState } from 'react'
import type { Player } from '../types'

interface AvatarProps {
  player: Pick<Player, 'name' | 'avatar'>
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'player' | 'offline'
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg', string> = {
  xs: 'avatar-xs',
  sm: 'avatar-sm',
  md: 'avatar-md',
  lg: 'avatar-lg',
}

const VARIANT_MAP: Record<'default' | 'player' | 'offline', string> = {
  default: '',
  player: 'avatar-player',
  offline: 'avatar-offline',
}

export function Avatar({ player, size = 'sm', variant = 'default' }: AvatarProps) {
  const [imgError, setImgError] = useState(false)

  const sizeClass = SIZE_MAP[size]
  const variantClass = VARIANT_MAP[variant]
  const classes = [
    'avatar',
    sizeClass,
    variantClass,
  ].filter(Boolean).join(' ')

  const initial = player.name.charAt(0).toUpperCase()

  // Use avatar image if available and not previously failed to load
  if (player.avatar && !imgError) {
    return (
      <div className={classes}>
        <img
          className="avatar-img"
          src={player.avatar}
          alt={player.name}
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  // Fallback to initial
  return <div className={classes}>{initial}</div>
}
