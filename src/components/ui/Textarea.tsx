'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { UseFormRegister } from 'react-hook-form';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'ref'> {
  label?: string;
  error?: string | { message?: string } | { type: string; message?: string } | undefined;
  hint?: string;
  register?: UseFormRegister<any>;
  name?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, register, name, ...props }: Omit<TextareaProps, 'ref'>, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${textareaId}-error`;
    const hintId = `${textareaId}-hint`;

    // Use ComponentPropsWithoutRef to ensure ref is not in props
    const textareaProps = props as React.ComponentPropsWithoutRef<'textarea'>;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="label">
            {label}
            {props.required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'input resize-y min-h-[100px]',
            error && 'input-error',
            className
          )}
          // @ts-expect-error - ref is handled by forwardRef, textareaProps excludes ref
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...(register && name ? register(name) : {})}
          {...textareaProps}
        />
        {error && (
          <p id={errorId} className="form-error" role="alert">
            {typeof error === 'string' ? error : error.message}
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
Textarea.displayName = 'Textarea';

export { Textarea };