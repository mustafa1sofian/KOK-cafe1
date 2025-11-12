'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAdminAuth } from '@/lib/auth';

export default function CertificatesPage() {
  const router = useRouter();

  useEffect(() => {
    if (!checkAdminAuth()) {
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">إدارة الشهادات</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">هذه الصفحة قيد التطوير...</p>
      </div>
    </div>
  );
}