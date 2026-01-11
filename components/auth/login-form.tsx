'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction, type LoginState } from '@/app/(auth)/login/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
    >
      {pending ? '登录中...' : '登录'}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction as any, undefined) as unknown as [
    LoginState | undefined,
    (payload: FormData) => void
  ];

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div className="space-y-4 rounded-md shadow-sm">
        <div>
          <label htmlFor="email" className="sr-only">
            邮箱地址
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="relative block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="邮箱地址"
            defaultValue="admin@xhs-evaluation.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            密码
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="relative block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="密码"
          />
        </div>
      </div>

      {state?.error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{state.error}</p>
        </div>
      )}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
