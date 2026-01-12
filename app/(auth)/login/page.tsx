import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

function LoginContent() {
  return (
    <div>
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">管理后台登录</h2>
        <p className="mt-2 text-sm text-gray-600">XHS 心理测评验证码管理系统</p>
      </div>
      <LoginForm />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">管理后台登录</h2>
          <p className="mt-2 text-sm text-gray-600">XHS 心理测评验证码管理系统</p>
        </div>
        <div className="mt-8 text-center text-sm text-gray-500">加载中...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
