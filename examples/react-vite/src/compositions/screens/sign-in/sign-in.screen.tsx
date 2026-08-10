import cl from 'clsx'

import { SignInForm } from 'domains/session'
import type { SignInScreenProps } from './types/sign-in-screen-props.type'
import styles from './styles/sign-in.module.css'

/**
 * Публичный экран входа в демонстрационный Simple Store.
 *
 * Используется для:
 *  - выбора admin или customer demo-сессии
 *  - краткого объяснения архитектурного среза приложения
 */
export const SignInScreen = (props: SignInScreenProps) => {
  const { className, ...rootAttrs } = props

  return (
    <main {...rootAttrs} className={cl(styles.root, className)}>
      <section className={styles.story}>
        <div className={styles.brand}>
          <span>S</span>
          <strong>SLM Store</strong>
        </div>
        <div className={styles.storyBody}>
          <span className={styles.kicker}>Small API · complete boundaries</span>
          <h1>Меньше кода.<br />Чётче владельцы.</h1>
          <p>
            Облегчённый storefront поверх JWT API: каталог, optimistic locking,
            draft order и защищённая история.
          </p>
        </div>
        <ol className={styles.layers} aria-label="SLM data flow">
          <li><span>01</span> app · lifecycle</li>
          <li><span>02</span> compositions · assembly</li>
          <li><span>03</span> domains · product meaning</li>
          <li><span>04</span> infra · OpenAPI transport</li>
        </ol>
      </section>

      <section className={styles.access} aria-labelledby="sign-in-title">
        <div className={styles.accessCard}>
          <span className={styles.status}><i /> Simple API · localhost:3001</span>
          <h2 id="sign-in-title">Войти в demo</h2>
          <p>Выберите роль. Credentials уже заполнены и сбрасываются вместе с backend.</p>
          <SignInForm />
        </div>
        <p className={styles.note}>Refresh token хранится только в sessionStorage текущей вкладки.</p>
      </section>
    </main>
  )
}
