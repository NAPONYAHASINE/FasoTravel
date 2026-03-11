import logo from 'figma:asset/ddaf4c7eb0e28936f4d0223e859065e25d5c3fc8.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export function Logo({ size = 'md', className = '', showText = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <img 
          src={logo} 
          alt="FasoTravel Logo" 
          className="w-full h-full object-contain drop-shadow-lg"
        />
      </div>
      {showText && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">FasoTravel</h2>
          <p className="text-xs text-gray-600">Admin Dashboard</p>
        </div>
      )}
    </div>
  );
}