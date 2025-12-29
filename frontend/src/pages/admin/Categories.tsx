import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlinePhotograph } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { Category } from '@/types';
import { categoriesAPI, uploadAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  image: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    image: '',
  });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await categoriesAPI.getAll();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Không thể tải danh mục');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image: category.image,
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '', image: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', image: '' });
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData({ ...formData, name, slug });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await uploadAPI.uploadImage(file);
      if (response.data.success) {
        setFormData({ ...formData, image: response.data.data.url });
        toast.success('Đã tải lên hình ảnh');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Không thể tải lên hình ảnh');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.image) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory._id, formData);
        toast.success('Đã cập nhật danh mục thành công');
      } else {
        await categoriesAPI.create(formData);
        toast.success('Đã tạo danh mục thành công');
      }
      handleCloseModal();
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      const message = error.response?.data?.message || 'Không thể lưu danh mục';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;

    try {
      await categoriesAPI.delete(id);
      toast.success('Đã xóa danh mục thành công');
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      const message = error.response?.data?.message || 'Không thể xóa danh mục';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading">Quản Lý Danh Mục</h1>
          <p className="text-neutral-500">Quản lý các danh mục sản phẩm</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Thêm Danh Mục
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <div key={category._id} className="bg-white rounded-xl shadow-sm overflow-hidden group">
            <div className="relative aspect-video">
              <img
                src={getImageUrl(category.image)}
                alt={category.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => handleOpenModal(category)}
                  className="p-2 bg-white rounded-full hover:bg-neutral-100"
                  title="Chỉnh sửa"
                >
                  <HiOutlinePencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(category._id)}
                  className="p-2 bg-white rounded-full hover:bg-red-50"
                  title="Xóa"
                >
                  <HiOutlineTrash className="w-5 h-5 text-red-500" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-medium">{category.name}</h3>
              <p className="text-sm text-neutral-500 line-clamp-2">{category.description}</p>
              <p className="text-xs text-neutral-400 mt-2">/{category.slug}</p>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-neutral-500">Chưa có danh mục nào. Hãy tạo danh mục đầu tiên!</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl">
                  {editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tên Danh Mục *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="VD: Bó Hoa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Đường Dẫn (Slug)
                </label>
                <input
                  type="text"
                  className="input bg-neutral-50"
                  value={formData.slug}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Mô Tả
                </label>
                <textarea
                  rows={3}
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả ngắn gọn về danh mục..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Hình Ảnh *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="URL hoặc tải lên hình ảnh"
                  />
                  <label className={`btn btn-secondary px-3 cursor-pointer ${isUploading ? 'opacity-50' : ''}`}>
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    ) : (
                      <HiOutlinePhotograph className="w-5 h-5" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {formData.image && (
                  <img
                    src={getImageUrl(formData.image)}
                    alt="Xem trước"
                    className="mt-2 w-full h-32 object-cover rounded-lg"
                  />
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary flex-1"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting ? 'Đang lưu...' : editingCategory ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
