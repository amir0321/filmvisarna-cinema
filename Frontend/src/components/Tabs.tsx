import React, { createContext, use, useId } from 'react'

export type TabsVariant = 'underline' | 'segmented' | 'vertical' | 'pills'

interface TabsContextValue {
  value: string
  onChange: (value: string) => void
  variant: TabsVariant
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext(): TabsContextValue {
  const context = use(TabsContext)
  if (!context) {
    throw new Error('Tabs compound components must be used within a <Tabs> component.')
  }
  return context
}

export interface TabsProps {
  value: string
  onChange: (value: string) => void
  variant?: TabsVariant
  accent?: 'default' | 'primary'
  children: React.ReactNode
  className?: string
  id?: string
}

export function Tabs({
  value,
  onChange,
  variant = 'underline',
  accent = 'default',
  children,
  className = '',
  id,
}: TabsProps) {
  const generatedId = useId()
  const baseId = id || generatedId

  const contextValue: TabsContextValue = {
    value,
    onChange,
    variant,
    baseId,
  }

  const containerClasses = [
    'fv-tabs',
    `fv-tabs-${variant}`,
    variant === 'segmented' && accent === 'primary' ? 'segmented-primary' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <TabsContext value={contextValue}>
      <div id={baseId} className={containerClasses}>
        {children}
      </div>
    </TabsContext>
  )
}

export interface TabsListProps {
  children: React.ReactNode
  ariaLabel?: string
  className?: string
}

export function TabsList({ children, ariaLabel, className = '' }: TabsListProps) {
  const { variant } = useTabsContext()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not([disabled])',
      ),
    )
    if (tabs.length === 0) return

    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement)
    if (currentIndex === -1) return

    const isVertical = variant === 'vertical'
    let nextIndex = -1

    if (
      (!isVertical && e.key === 'ArrowRight') ||
      (isVertical && e.key === 'ArrowDown')
    ) {
      e.preventDefault()
      nextIndex = (currentIndex + 1) % tabs.length
    } else if (
      (!isVertical && e.key === 'ArrowLeft') ||
      (isVertical && e.key === 'ArrowUp')
    ) {
      e.preventDefault()
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIndex = tabs.length - 1
    }

    if (nextIndex !== -1) {
      tabs[nextIndex].focus()
      tabs[nextIndex].click()
    }
  }

  const combinedClass = ['fv-tab-list', className].filter(Boolean).join(' ')

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation={variant === 'vertical' ? 'vertical' : 'horizontal'}
      className={combinedClass}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  )
}

export interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  badge?: React.ReactNode
  disabled?: boolean
  className?: string
  id?: string
}

export function TabsTrigger({
  value,
  children,
  badge,
  disabled = false,
  className = '',
  id,
}: TabsTriggerProps) {
  const { value: selectedValue, onChange, baseId } = useTabsContext()
  const isSelected = selectedValue === value
  const tabId = id || `${baseId}-tab-${value}`
  const panelId = `${baseId}-panel-${value}`

  const combinedClass = [
    'fv-tab-trigger',
    isSelected ? 'active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      id={tabId}
      type="button"
      role="tab"
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      className={combinedClass}
      onClick={() => onChange(value)}
    >
      <span>{children}</span>
      {badge !== undefined ? <span className="ms-1">{badge}</span> : null}
    </button>
  )
}

export interface TabsPanelProps {
  value: string
  children: React.ReactNode
  className?: string
  id?: string
}

export function TabsPanel({
  value,
  children,
  className = '',
  id,
}: TabsPanelProps) {
  const { value: selectedValue, baseId } = useTabsContext()
  const isSelected = selectedValue === value
  const panelId = id || `${baseId}-panel-${value}`
  const tabId = `${baseId}-tab-${value}`

  if (!isSelected) {
    return null
  }

  const combinedClass = ['fv-tab-panel', className].filter(Boolean).join(' ')

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      tabIndex={0}
      className={combinedClass}
    >
      {children}
    </div>
  )
}

Tabs.List = TabsList
Tabs.Trigger = TabsTrigger
Tabs.Panel = TabsPanel
