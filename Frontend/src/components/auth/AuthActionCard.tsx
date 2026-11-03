import { useId, type ReactNode } from 'react'

export default function AuthActionCard({ title, description, children }: {
  title: string
  description: string
  children: ReactNode
}) {
  const titleId = useId()
  return (
    <section className="fv-auth-page" aria-labelledby={titleId}>
      <div className="fv-auth-card">
        <div className="fv-auth-icon" aria-hidden="true"><i className="bi bi-shield-lock" /></div>
        <h1 id={titleId}>{title}</h1>
        <p className="fv-auth-intro">{description}</p>
        {children}
      </div>
    </section>
  )
}
