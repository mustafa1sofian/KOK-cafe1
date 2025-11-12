import React from 'react';

+interface LoadingIndicatorProps {
+  size?: 'sm' | 'md' | 'lg';
+  color?: 'primary' | 'secondary' | 'accent';
+  className?: string;
+}
+
+export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
+  size = 'md', 
+  color = 'primary',
+  className = '' 
+}) => {
+  const sizeClasses = {
+    sm: 'w-4 h-4',
+    md: 'w-6 h-6',
+    lg: 'w-8 h-8'
+  };
+
+  const colorClasses = {
+    primary: 'border-yellow-600 border-t-transparent',
+    secondary: 'border-white border-t-transparent',
+    accent: 'border-black border-t-transparent'
+  };
+
+  return (
+    <div className={`inline-block ${sizeClasses[size]} ${className}`}>
+      <div 
+        className={`w-full h-full border-2 rounded-full animate-spin ${colorClasses[color]}`}
+        role="status"
+        aria-label="Loading"
+      />
+    </div>
+  );
+};
+
+export default LoadingIndicator;