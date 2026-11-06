'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { UseFormRegister } from 'react-hook-form';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'ref'> {
  label?: string;
  error?: string | { message?: string } | { type: string; message?: string } | undefined;
  hint?: string;
  register?: UseFormRegister<any>;
  name?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, hint, id, register, name, ...props }: Omit<InputProps, 'ref'>, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    // Use ComponentPropsWithoutRef to ensure ref is not in props
    const inputProps = props as React.ComponentPropsWithoutRef<'input'>;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
            {props.required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <Input
          type={type}
          id={inputId}
          className={cn(
            'input',
            error && 'input-error',
            className
          )}
          // @ts-expect-error - ref is handled by forwardRef, inputProps excludes ref
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...(register && name ? register(name) : {})}
          {...inputProps}
        />
        {error && (
          <p id={errorId} className="form-error" role="alert">
            {typeof error === 'string' ? error : error.message || ''}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="form-hint">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };