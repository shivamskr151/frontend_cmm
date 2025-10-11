import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
  border?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  rounded = 'lg',
  border = false,
  hover = false,
  onClick
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    none: ''
  };

  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-lg',
    lg: 'shadow-xl',
    xl: 'shadow-2xl',
    none: ''
  };

  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    none: ''
  };

  const classes = `
    bg-white
    ${paddingClasses[padding]}
    ${shadowClasses[shadow]}
    ${roundedClasses[rounded]}
    ${border ? 'border border-gray-200' : ''}
    ${hover ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-200' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim();

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
