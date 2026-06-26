import { forwardRef, type ReactNode, type Ref } from 'react'

interface ListProps {
  children: ReactNode
  className?: string
}

/**
 * List container — wraps children in `<div className="list">`.
 *
 * Provides a consistent wrapper for `.list` / `.list-item` styled lists.
 * Forwards `ref` for keyboard navigation hooks.
 */
export const List = forwardRef<HTMLDivElement, ListProps>(function List(
  { children, className = '' },
  ref: Ref<HTMLDivElement>,
) {
  return (
    <div ref={ref} className={`list${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
})
