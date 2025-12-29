import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI } from '@/utils/api';
import { useAuthStore } from '@/store/useStore';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await authAPI.register(data.name, data.email, data.password);
      const { user, token } = response.data.data;
      login(user, token);
      toast.success('Tạo tài khoản thành công!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-4xl">🌸</span>
          </Link>
          <h1 className="font-heading text-3xl mb-2">Tạo Tài Khoản</h1>
          <p className="text-neutral-500">Tham gia cùng chúng tôi và bắt đầu mua sắm hoa đẹp</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Họ và Tên
            </label>
            <input
              type="text"
              className={`input ${errors.name ? 'border-red-500 focus:ring-red-200' : ''}`}
              placeholder="Nguyễn Văn A"
              {...register('name', {
                required: 'Vui lòng nhập họ tên',
                minLength: {
                  value: 2,
                  message: 'Họ tên phải có ít nhất 2 ký tự',
                },
              })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Địa Chỉ Email
            </label>
            <input
              type="email"
              className={`input ${errors.email ? 'border-red-500 focus:ring-red-200' : ''}`}
              placeholder="email@example.com"
              {...register('email', {
                required: 'Vui lòng nhập email',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Địa chỉ email không hợp lệ',
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Mật Khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`input pr-12 ${errors.password ? 'border-red-500 focus:ring-red-200' : ''}`}
                placeholder="••••••••"
                {...register('password', {
                  required: 'Vui lòng nhập mật khẩu',
                  minLength: {
                    value: 6,
                    message: 'Mật khẩu phải có ít nhất 6 ký tự',
                  },
                })}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <HiOutlineEyeOff className="w-5 h-5" />
                ) : (
                  <HiOutlineEye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Xác Nhận Mật Khẩu
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className={`input ${errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : ''}`}
              placeholder="••••••••"
              {...register('confirmPassword', {
                required: 'Vui lòng xác nhận mật khẩu',
                validate: (value) =>
                  value === password || 'Mật khẩu không khớp',
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary disabled:opacity-50"
          >
            {isLoading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản'}
          </button>
        </form>

        <p className="text-center mt-8 text-neutral-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
