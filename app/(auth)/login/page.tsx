import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
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
