import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    relative overflow-hidden
    ${fullWidth ? 'w-full' : ''}
  `;

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-lg'
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-500 to-blue-600
      hover:from-blue-600 hover:to-blue-700
      text-white shadow-lg shadow-blue-500/25
      hover:shadow-xl hover:shadow-blue-500/40
      focus:ring-blue-500
      active:scale-95
    `,
    secondary: `
      bg-gradient-to-r from-gray-500 to-gray-600
      hover:from-gray-600 hover:to-gray-700
      text-white shadow-lg shadow-gray-500/25
      hover:shadow-xl hover:shadow-gray-500/40
      focus:ring-gray-500
      active:scale-95
    `,
    success: `
      bg-gradient-to-r from-green-500 to-green-600
      hover:from-green-600 hover:to-green-700
      text-white shadow-lg shadow-green-500/25
      hover:shadow-xl hover:shadow-green-500/40
      focus:ring-green-500
      active:scale-95
    `,
    warning: `
      bg-gradient-to-r from-yellow-500 to-yellow-600
      hover:from-yellow-600 hover:to-yellow-700
      text-white shadow-lg shadow-yellow-500/25
      hover:shadow-xl hover:shadow-yellow-500/40
      focus:ring-yellow-500
      active:scale-95
    `,
    error: `
      bg-gradient-to-r from-red-500 to-red-600
      hover:from-red-600 hover:to-red-700
      text-white shadow-lg shadow-red-500/25
      hover:shadow-xl hover:shadow-red-500/40
      focus:ring-red-500
      active:scale-95
    `,
    ghost: `
      bg-transparent hover:bg-gray-100
      text-gray-700 hover:text-gray-900
      border border-transparent
      focus:ring-gray-500
      active:scale-95
    `,
    outline: `
      bg-transparent border-2
      border-gray-300 hover:border-gray-400
      text-gray-700 hover:text-gray-900
      hover:bg-gray-50
      focus:ring-gray-500
      active:scale-95
    `
  };

  const classes = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim();

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-lg">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
      
      {/* Content */}
      <div className={`flex items-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </div>
    </button>
  );
};

export default Button;
