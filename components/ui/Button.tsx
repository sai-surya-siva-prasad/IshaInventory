import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyle = "font-semibold transition-all duration-200 active:opacity-50 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-iosBlue text-white rounded-[12px]",
    secondary: "bg-transparent text-iosBlue rounded-[12px]",
    danger: "bg-transparent text-[#FF3B30] rounded-[12px]",
    ghost: "bg-transparent text-iosGray rounded-[12px]"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-3 text-[17px]",
    lg: "px-6 py-4 text-[19px]"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className} disabled:opacity-30`}
      {...props}
    >
      {children}
    </button>
  );
};