import { useState } from 'react'
import cl from 'clsx'

import { Button } from 'ui/button'
import { useSession } from '../../hooks/use-session.hook'
import type { SessionBadgeProps } from './types/session-badge-props.type'
import styles from './styles/session-badge.module.css'

/**
 * Краткое представление пользователя и действие выхода.
 *
 * Используется для:
 *  - отображения активной роли в application shell
 *  - завершения пользовательской сессии
 */
export const SessionBadge = (props: SessionBadgeProps) => {
  const { className, ...rootAttrs } = props
  const { user, logout } = useSession()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  /**
   * Завершает сессию и блокирует повторное действие до очистки контекста.
   */
  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true)
    await logout()
  }

  if (!user) {
    return null
  }

  const roleLabel = user.role === 'admin' ? 'Администратор' : 'Покупатель'
  const initials = user.name
    .split(' ')
    .map((part) => part.slice(0, 1))
    .join('')
    .slice(0, 2)

  let avatar = <span className={styles.avatarFallback}>{initials}</span>

  if (user.avatarUrl) {
    avatar = <img className={styles.avatar} src={user.avatarUrl} alt="" />
  }

  return (
    <div {...rootAttrs} className={cl(styles.root, className)}>
      {avatar}
      <span className={styles.identity}>
        <strong>{user.name}</strong>
        <span>{roleLabel}</span>
      </span>
      <Button variant="ghost" size="small" isLoading={isLoggingOut} onClick={handleLogout}>
        Выйти
      </Button>
    </div>
  )
}
