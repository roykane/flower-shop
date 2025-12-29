import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { HiOutlinePhotograph, HiOutlineX, HiOutlineArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { Category } from '@/types';
import { productsAPI, categoriesAPI, uploadAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  isActive: boolean;
}

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [images, setImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      isActive: true,
      stock: 0,
    },
  });

  const name = watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !isEditing) {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('slug', slug);
    }
  }, [name, setValue, isEditing]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getAll();
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Không thể tải danh mục');
      }
    };
    fetchCategories();
  }, []);

  // Fetch product data when editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchProduct = async () => {
        setIsFetching(true);
        try {
          const response = await productsAPI.getById(id);
          if (response.data.success) {
            const product = response.data.data.product || response.data.data;
            setValue('name', product.name);
            setValue('slug', product.slug);
            setValue('description', product.description);
            setValue('price', product.price);
            setValue('category', product.category?._id || product.category);
            setValue('stock', product.stock);
            setValue('isActive', product.isActive);
            setImages(product.images || []);
          }
        } catch (error) {
          console.error('Error fetching product:', error);
          toast.error('Không thể tải thông tin sản phẩm');
          navigate('/admin/products');
        } finally {
          setIsFetching(false);
        }
      };
      fetchProduct();
    }
  }, [isEditing, id, setValue, navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const fileArray = Array.from(files);
      const response = await uploadAPI.uploadMultiple(fileArray);

      if (response.data.success) {
        const uploadedUrls = response.data.data.map((img: { url: string }) => img.url);
        setImages(prev => [...prev, ...uploadedUrls]);
        toast.success(`Đã tải lên ${uploadedUrls.length} hình ảnh`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Không thể tải lên hình ảnh');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    if (images.length === 0) {
      toast.error('Vui lòng thêm ít nhất một hình ảnh');
      return;
    }

    setIsLoading(true);
    try {
      const productData = {
        ...data,
        price: Number(data.price),
        stock: Number(data.stock),
        images,
      };

      if (isEditing && id) {
        await productsAPI.update(id, productData);
        toast.success('Đã cập nhật sản phẩm thành công!');
      } else {
        await productsAPI.create(productData);
        toast.success('Đã tạo sản phẩm thành công!');
      }
      navigate('/admin/products');
    } catch (error: any) {
      console.error('Error saving product:', error);
      const message = error.response?.data?.message || 'Không thể lưu sản phẩm';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/products')}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-700 mb-4"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
          Quay lại
        </button>
        <h1 className="text-2xl font-heading">
          {isEditing ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
        </h1>
        <p className="text-neutral-500">
          {isEditing ? 'Cập nhật thông tin sản phẩm' : 'Tạo sản phẩm mới cho cửa hàng'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-heading text-lg mb-6">Thông Tin Cơ Bản</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tên Sản Phẩm *
                  </label>
                  <input
                    type="text"
                    className={`input ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="VD: Bó Hồng Đỏ Cổ Điển"
                    {...register('name', { required: 'Vui lòng nhập tên sản phẩm' })}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Đường Dẫn (Slug) *
                  </label>
                  <input
                    type="text"
                    className="input bg-neutral-50"
                    {...register('slug', { required: 'Slug là bắt buộc' })}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Tự động tạo từ tên sản phẩm
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mô Tả *
                  </label>
                  <textarea
                    rows={5}
                    className={`input ${errors.description ? 'border-red-500' : ''}`}
                    placeholder="Mô tả chi tiết về sản phẩm..."
                    {...register('description', { required: 'Vui lòng nhập mô tả' })}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-heading text-lg mb-6">Hình Ảnh</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img
                      src={getImageUrl(image)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <HiOutlineX className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-primary text-white text-xs rounded">
                        Ảnh Chính
                      </span>
                    )}
                  </div>
                ))}
                <label className={`aspect-square rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  ) : (
                    <>
                      <HiOutlinePhotograph className="w-8 h-8 text-neutral-400 mb-2" />
                      <span className="text-sm text-neutral-500">Thêm Ảnh</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <p className="text-sm text-neutral-500">
                Ảnh đầu tiên sẽ được dùng làm ảnh đại diện sản phẩm
              </p>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-heading text-lg mb-6">Giá & Kho Hàng</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Giá (VNĐ) *
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    className={`input ${errors.price ? 'border-red-500' : ''}`}
                    placeholder="0"
                    {...register('price', {
                      required: 'Vui lòng nhập giá',
                      min: { value: 0, message: 'Giá phải lớn hơn 0' },
                    })}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Số Lượng Kho *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`input ${errors.stock ? 'border-red-500' : ''}`}
                    {...register('stock', {
                      required: 'Vui lòng nhập số lượng',
                      min: { value: 0, message: 'Số lượng phải lớn hơn hoặc bằng 0' },
                    })}
                  />
                  {errors.stock && (
                    <p className="text-sm text-red-500 mt-1">{errors.stock.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-heading text-lg mb-6">Trạng Thái</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded text-primary focus:ring-primary"
                  {...register('isActive')}
                />
                <div>
                  <p className="font-medium">Đang Bán</p>
                  <p className="text-sm text-neutral-500">Sản phẩm hiển thị với khách hàng</p>
                </div>
              </label>
            </div>

            {/* Category */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-heading text-lg mb-6">Danh Mục</h2>
              <select
                className={`input ${errors.category ? 'border-red-500' : ''}`}
                {...register('category', { required: 'Vui lòng chọn danh mục' })}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || isUploading}
                  className="btn btn-primary w-full"
                >
                  {isLoading ? 'Đang lưu...' : isEditing ? 'Cập Nhật Sản Phẩm' : 'Tạo Sản Phẩm'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/products')}
                  className="btn btn-secondary w-full"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
