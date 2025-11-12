'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signInAdmin } from '@/lib/auth';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await signInAdmin(email, password);
      if (success) {
        router.push('/admin');
      } else {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } catch (error: any) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-arabic">
            لوحة التحكم
          </h1>
          <p className="text-gray-400 font-arabic">
            تسجيل دخول الإدارة
          </p>
        </div>

        {/* Login Form */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-white mb-6 text-center font-arabic">
              تسجيل الدخول
            </h2>

            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-700">
                <AlertDescription className="text-red-200 font-arabic text-right">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-white text-sm font-arabic text-right mb-2">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="أدخل البريد الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pr-12 text-right font-arabic h-12 focus:border-yellow-600 focus:ring-yellow-600"
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-white text-sm font-arabic text-right mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pl-12 text-right font-arabic h-12 focus:border-yellow-600 focus:ring-yellow-600"
                  />
                </div>
              </div>
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold font-arabic text-lg transition-all duration-300" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري تسجيل الدخول...</span>
                  </div>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </form>

            {/* Back to Main Site Link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-yellow-600 text-sm font-arabic transition-colors duration-300"
              >
                ← العودة للصفحة الرئيسية
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}