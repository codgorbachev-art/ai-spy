import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonGlowProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

const ButtonGlow: React.FC<ButtonGlowProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "relative px-8 py-4 rounded-xl font-medium text-sm tracking-wider uppercase transition-all duration-300 overflow-hidden group";
  
  const variants = {
    primary: "bg-transparent text-white border border-brand-cyan/30 hover:border-brand-cyan/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]",
    secondary: "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-white/20"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </span>
      
      {/* Click Pulse Effect */}
      <motion.div 
        className="absolute inset-0 z-0 bg-white/10 rounded-xl"
        initial={{ opacity: 0, scale: 0.8 }}
        whileTap={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.1 }}
      />
      
      {/* Glow effect gradient */}
      {variant === 'primary' && (
        <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-cyan blur-xl" />
      )}
      
      {/* Glass shine */}
      <div className="absolute inset-0 -z-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.button>
  );
};

export default ButtonGlow;