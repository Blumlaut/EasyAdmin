import { Skeleton } from './Skeleton'
import { List } from './List'
import { ListItem } from './ListItem'

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
    <List>
      {Array.from({ length: count }).map((_, i) => (
        <ListItem key={i}>
          <Skeleton width={32} height={32} circle />
          <div className="list-item-content flex flex-col gap-1">
            <Skeleton width="40%" height={14} />
            <Skeleton width="60%" height={12} />
          </div>
        </ListItem>
      ))}
    </List>
  )
}
