import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Link, type LinkProps } from "react-router-dom"

type ButtonVariant = "primary" | "secondary" | "tertiary"
type ButtonSize = "sm" | "md" | "lg"

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
} & (
  | (ButtonHTMLAttributes<HTMLButtonElement> & {
      to?: never
      loading?: boolean
    })
  | (Omit<LinkProps, "to"> & {
      to: LinkProps["to"]
      loading?: never
      disabled?: never
    })
)

const variants: Record<ButtonVariant, string> = {
  primary: "bg-linear-to-b from-gold-light to-gold",
  secondary: "bg-secondary",
  tertiary: "bg-surface",
}

const sizes: Record<ButtonSize, string> = {
  sm: "px-5 py-2 text-base",
  md: "px-7 py-3 text-xl",
  lg: "px-10 py-4 text-2xl",
}

const baseStyles = [
  "inline-flex items-center justify-center text-center",
  "rounded-[20px] border-4 border-border",
  "font-display text-foreground",
  "shadow-[0_7px_0_0_var(--color-border)]",
  "transition-[transform,box-shadow,filter] duration-100",
  "hover:brightness-105",
  "active:translate-y-[7px] active:shadow-none",
  "focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-secondary",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "disabled:hover:brightness-100",
  "disabled:active:translate-y-0 disabled:active:shadow-[0_7px_0_0_var(--color-border)]",
].join(" ")

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const styles = [baseStyles, variants[variant], sizes[size], className].join(" ")

  if (props.to !== undefined) {
    const { to, ...linkProps } = props

    return (
      <Link {...linkProps} to={to} className={styles}>
        {children}
      </Link>
    )
  }

  const { loading = false, disabled, type = "button", ...buttonProps } = props

  return (
    <button
      {...buttonProps}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={styles}
    >
      {loading ? "Chargement..." : children}
    </button>
  )
}
