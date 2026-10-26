import React, { createContext, use, useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

export type ModalSize = 'sm' | 'md' | 'lg'

interface ModalContextValue {
  onClose: () => void
  titleId: string
}

const ModalContext = createContext<ModalContextValue | null>(null)

function useModalContext(): ModalContextValue {
  const context = use(ModalContext)
  if (!context) {
    throw new Error('Modal subcomponents must be used within a <Modal> component.')
  }
  return context
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: ModalSize
  mobileBottomSheet?: boolean
  children: React.ReactNode
  className?: string
  id?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  mobileBottomSheet = true,
  children,
  className = '',
  id,
}: ModalProps) {
  const generatedId = useId()
  const titleId = id ? `${id}-title` : `${generatedId}-title`

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const backdropClasses = [
    'fv-modal-backdrop',
    mobileBottomSheet ? 'as-bottom-sheet' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const dialogClasses = [
    'fv-modal-dialog',
    `size-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const modalNode = (
    <ModalContext value={{ onClose, titleId }}>
      <div
        className={backdropClasses}
        onClick={handleBackdropClick}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          className={dialogClasses}
        >
          {mobileBottomSheet ? (
            <div className="fv-bottom-sheet-handle d-md-none" aria-hidden="true" />
          ) : null}
          {title ? (
            <ModalHeader title={title} />
          ) : null}
          {children}
        </div>
      </div>
    </ModalContext>
  )

  return createPortal(modalNode, document.body)
}

export interface ModalHeaderProps {
  title?: string
  onClose?: () => void
  children?: React.ReactNode
  className?: string
}

export function ModalHeader({
  title,
  onClose: customOnClose,
  children,
  className = '',
}: ModalHeaderProps) {
  const { onClose: contextOnClose, titleId } = useModalContext()
  const handleClose = customOnClose || contextOnClose

  const combinedClass = ['fv-modal-header', className].filter(Boolean).join(' ')

  return (
    <div className={combinedClass}>
      {title ? (
        <h2 id={titleId} className="fv-modal-title">
          {title}
        </h2>
      ) : (
        children
      )}
      <button
        type="button"
        className="fv-modal-close"
        onClick={handleClose}
        aria-label="Stäng"
      >
        <i className="bi bi-x-lg" aria-hidden="true" />
      </button>
    </div>
  )
}

export interface ModalBodyProps {
  children: React.ReactNode
  className?: string
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  const combinedClass = ['fv-modal-body', className].filter(Boolean).join(' ')
  return <div className={combinedClass}>{children}</div>
}

export interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  const combinedClass = ['fv-modal-footer', className].filter(Boolean).join(' ')
  return <div className={combinedClass}>{children}</div>
}

Modal.Header = ModalHeader
Modal.Body = ModalBody
Modal.Footer = ModalFooter
