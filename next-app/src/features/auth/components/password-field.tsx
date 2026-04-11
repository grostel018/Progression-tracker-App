"use client";

import { Eye, EyeOff } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
  helperText?: ReactNode;
  labelAction?: ReactNode;
};

export function PasswordField({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  autoComplete,
  className,
  defaultValue,
  error,
  helperText,
  id,
  label,
  labelAction,
  name,
  placeholder,
  required,
  value,
  ...props
}: PasswordFieldProps): JSX.Element {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [isVisible, setIsVisible] = useState(false);
  const helperTextId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, helperTextId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-foreground" htmlFor={inputId}>
          {label}
        </label>
        {labelAction}
      </div>

      <div className="relative">
        <Input
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid ?? (error ? true : undefined)}
          autoComplete={autoComplete}
          className={`pr-14 ${className ?? ""}`.trim()}
          defaultValue={defaultValue}
          id={inputId}
          name={name}
          placeholder={placeholder}
          required={required}
          type={isVisible ? "text" : "password"}
          value={value}
          {...props}
        />
        <Button
          aria-controls={inputId}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 text-muted hover:text-foreground hover:bg-[var(--color-surface-muted)] transition-all"
          onClick={() => setIsVisible((current) => !current)}
          size="sm"
          type="button"
          variant="ghost"
        >
          {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>

      {helperText ? (
        <p className="text-sm text-muted" id={helperTextId}>
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-danger" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
