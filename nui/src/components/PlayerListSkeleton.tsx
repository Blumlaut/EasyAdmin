import { Skeleton } from './Skeleton'

interface PlayerListSkeletonProps {
  count?: number
}

/**
 * Skeleton loading state for player list views.
 *
 * Shared between PlayerListPage and CachedPlayersPage.
 */
export function PlayerListSkeleton({ count = 4 }: PlayerListSkeletonProps) {
  return (
    <div className="list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="list-item">
          <Skeleton width={32} height={32} circle />
          <div className="list-item-content flex flex-col gap-1">
            <Skeleton width="40%" height={14} />
            <Skeleton width="60%" height={12} />
          </div>
        </div>
      ))}
    </div>
  )
}
