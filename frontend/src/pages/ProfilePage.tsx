import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineKey, HiOutlineLogout, HiOutlineCamera } from 'react-icons/hi';
import { useAuthStore } from '@/store/useStore';
import { authAPI, uploadAPI } from '@/utils/api';
import { API_URL } from '@/utils/helpers';

// Avatar constraints
const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB max file size
const AVATAR_MAX_DIMENSION = 500; // 500x500 max dimensions
const AVATAR_QUALITY = 0.8; // JPEG quality

// Resize and compress image
const resizeImage = (file: File, maxDimension: number, quality: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // Cleanup object URL
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
};

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) return avatarPath;
    return `${API_URL}${avatarPath}`;
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    // Check original file size (reject if > 10MB to prevent browser issues)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ảnh gốc quá lớn (tối đa 10MB). Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Resize and compress image
      let processedFile = file;

      // Always resize to ensure consistent avatar size
      toast.loading('Đang xử lý ảnh...', { id: 'processing' });
      processedFile = await resizeImage(file, AVATAR_MAX_DIMENSION, AVATAR_QUALITY);
      toast.dismiss('processing');

      // Check processed file size
      if (processedFile.size > AVATAR_MAX_SIZE) {
        // Try with lower quality
        processedFile = await resizeImage(file, AVATAR_MAX_DIMENSION, 0.6);
        if (processedFile.size > AVATAR_MAX_SIZE) {
          toast.error('Không thể nén ảnh đủ nhỏ. Vui lòng chọn ảnh khác.');
          return;
        }
      }

      // Upload avatar (uses /upload/avatar endpoint - no admin required)
      const uploadResponse = await uploadAPI.uploadAvatar(processedFile);
      const avatarUrl = uploadResponse.data.url || uploadResponse.data.data?.url;

      if (uploadResponse.data.success && avatarUrl) {
        // Update profile with new avatar
        const updateResponse = await authAPI.updateProfile({
          avatar: avatarUrl,
        });
        if (updateResponse.data.success) {
          updateUser({ avatar: avatarUrl });
          toast.success('Cập nhật ảnh đại diện thành công!');
        } else {
          toast.error('Không thể cập nhật ảnh đại diện');
        }
      } else {
        toast.error('Không thể tải ảnh lên');
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.dismiss('processing');
      toast.error(error.response?.data?.message || 'Không thể tải ảnh lên');
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Đã đăng xuất thành công!');
  };

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      address: '',
    },
  });

  const passwordForm = useForm<PasswordForm>();

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const response = await authAPI.updateProfile({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
      });
      if (response.data.success) {
        // Update local store with new user data
        updateUser({
          name: data.name,
          email: data.email,
        });
        toast.success('Cập nhật thông tin thành công!');
      } else {
        toast.error(response.data.message || 'Không thể cập nhật thông tin');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (data.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    setIsLoading(true);
    try {
      const response = await authAPI.changePassword(data.currentPassword, data.newPassword);
      if (response.data.success) {
        toast.success('Đổi mật khẩu thành công!');
        passwordForm.reset();
      } else {
        toast.error(response.data.message || 'Không thể đổi mật khẩu');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Mật khẩu hiện tại không đúng');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-3xl mb-8">Tài Khoản Của Tôi</h1>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-primary border-b-2 border-primary'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Thông Tin Cá Nhân
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'password'
                ? 'text-primary border-b-2 border-primary'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Đổi Mật Khẩu
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              {/* Avatar */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img
                        src={getAvatarUrl(user.avatar) || ''}
                        alt={user?.name || 'Avatar'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl text-primary">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {isUploadingAvatar ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    ) : (
                      <HiOutlineCamera className="w-6 h-6 text-white" />
                    )}
                  </button>
                </div>
                <div>
                  <h2 className="font-heading text-xl">{user?.name}</h2>
                  <p className="text-neutral-500">{user?.email}</p>
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                    className="text-primary text-sm mt-2 hover:underline disabled:opacity-50"
                  >
                    {isUploadingAvatar ? 'Đang tải...' : 'Đổi Ảnh Đại Diện'}
                  </button>
                </div>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <HiOutlineUser className="w-4 h-4" />
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    className="input"
                    {...profileForm.register('name', { required: true })}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <HiOutlineMail className="w-4 h-4" />
                    Địa Chỉ Email
                  </label>
                  <input
                    type="email"
                    className="input"
                    {...profileForm.register('email', { required: true })}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <HiOutlinePhone className="w-4 h-4" />
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+84 912 345 678"
                    {...profileForm.register('phone')}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <HiOutlineLocationMarker className="w-4 h-4" />
                    Địa Chỉ Giao Hàng Mặc Định
                  </label>
                  <textarea
                    rows={3}
                    className="input"
                    placeholder="Nhập địa chỉ giao hàng mặc định của bạn"
                    {...profileForm.register('address')}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <HiOutlineKey className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl">Đổi Mật Khẩu</h2>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mật Khẩu Hiện Tại
                  </label>
                  <input
                    type="password"
                    className="input"
                    {...passwordForm.register('currentPassword', { required: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mật Khẩu Mới
                  </label>
                  <input
                    type="password"
                    className="input"
                    {...passwordForm.register('newPassword', { required: true, minLength: 6 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Xác Nhận Mật Khẩu Mới
                  </label>
                  <input
                    type="password"
                    className="input"
                    {...passwordForm.register('confirmPassword', { required: true })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? 'Đang đổi...' : 'Đổi Mật Khẩu'}
              </button>
            </div>
          </form>
        )}

        {/* Logout Section */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <HiOutlineLogout className="w-5 h-5" />
            Đăng Xuất
          </button>
        </div>
      </div>
    </div>
  );
}
