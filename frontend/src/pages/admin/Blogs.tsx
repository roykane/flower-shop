import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiEye,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiStar,
  HiOutlinePhotograph,
  HiX,
} from 'react-icons/hi';
import { blogsAPI, uploadAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';
import toast from 'react-hot-toast';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string;
  category: string;
  status: 'draft' | 'published';
  featured: boolean;
  views: number;
  publishedAt: string;
  createdAt: string;
  author?: {
    name: string;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  'tin-tuc': 'Tin Tức',
  'huong-dan': 'Hướng Dẫn',
  'meo-hay': 'Mẹo Hay',
  'su-kien': 'Sự Kiện',
  'khac': 'Khác',
};

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    thumbnail: '',
    category: 'tin-tuc',
    tags: '',
    status: 'draft',
    featured: false,
    metaTitle: '',
    metaDescription: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 20,
      };
      if (statusFilter) params.status = statusFilter;

      const response = await blogsAPI.adminGetAll(params);

      if (response.data.success) {
        setBlogs(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Lỗi tải danh sách bài viết');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, statusFilter]);

  const handleOpenModal = (blog?: Blog) => {
    if (blog) {
      setEditingBlog(blog);
      // Fetch full blog data
      blogsAPI.adminGetById(blog._id).then((res) => {
        if (res.data.success) {
          const b = res.data.data;
          setFormData({
            title: b.title,
            excerpt: b.excerpt || '',
            content: b.content,
            thumbnail: b.thumbnail || '',
            category: b.category,
            tags: b.tags?.join(', ') || '',
            status: b.status,
            featured: b.featured,
            metaTitle: b.metaTitle || '',
            metaDescription: b.metaDescription || '',
          });
        }
      });
    } else {
      setEditingBlog(null);
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        thumbnail: '',
        category: 'tin-tuc',
        tags: '',
        status: 'draft',
        featured: false,
        metaTitle: '',
        metaDescription: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
      };

      if (editingBlog) {
        await blogsAPI.update(editingBlog._id, data);
        toast.success('Cập nhật bài viết thành công');
      } else {
        await blogsAPI.create(data);
        toast.success('Tạo bài viết thành công');
      }

      setShowModal(false);
      fetchBlogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;

    try {
      await blogsAPI.delete(id);
      toast.success('Xóa bài viết thành công');
      fetchBlogs();
    } catch (error) {
      toast.error('Lỗi xóa bài viết');
    }
  };

  const handleToggleFeatured = async (blog: Blog) => {
    try {
      await blogsAPI.update(blog._id, { featured: !blog.featured });
      toast.success(blog.featured ? 'Đã bỏ nổi bật' : 'Đã đánh dấu nổi bật');
      fetchBlogs();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadAPI.uploadImage(file);
      if (response.data.success) {
        setFormData({ ...formData, thumbnail: response.data.data.url });
        toast.success('Upload ảnh thành công');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Lỗi upload ảnh');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Blog</h1>
          <p className="text-gray-600">Quản lý các bài viết trên trang web</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
        >
          <HiPlus className="w-5 h-5" />
          Thêm bài viết
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Bản nháp</option>
          <option value="published">Đã xuất bản</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12">
          <HiOutlineDocumentText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Chưa có bài viết nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Bài viết
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Danh mục
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  Lượt xem
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Ngày tạo
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {blogs.map((blog) => (
                <tr key={blog._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {blog.thumbnail ? (
                        <img
                          src={getImageUrl(blog.thumbnail)}
                          alt=""
                          className="w-16 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <HiOutlineDocumentText className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium line-clamp-1">{blog.title}</span>
                          {blog.featured && (
                            <HiStar className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <span className="text-sm text-gray-500 line-clamp-1">
                          {blog.excerpt}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                      {CATEGORY_LABELS[blog.category] || blog.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-sm rounded ${
                        blog.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {blog.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-gray-600">
                      <HiEye className="w-4 h-4" />
                      {blog.views}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <HiOutlineCalendar className="w-4 h-4" />
                      {formatDate(blog.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggleFeatured(blog)}
                        className={`p-2 rounded-lg transition-colors ${
                          blog.featured
                            ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={blog.featured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
                      >
                        <HiStar className="w-5 h-5" />
                      </button>
                      <Link
                        to={`/blog/${blog.slug}`}
                        target="_blank"
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Xem bài viết"
                      >
                        <HiEye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleOpenModal(blog)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <HiPencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(blog._id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Xóa"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-lg transition-all ${
                currentPage === page
                  ? 'bg-rose-500 text-white'
                  : 'bg-white border border-gray-200 hover:border-rose-300'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b z-10">
              <h2 className="text-xl font-bold">
                {editingBlog ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Mô tả ngắn
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none font-mono text-sm"
                    placeholder="Hỗ trợ HTML..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ảnh thumbnail
                  </label>

                  {/* Thumbnail Preview */}
                  {formData.thumbnail && (
                    <div className="relative mb-3 inline-block">
                      <img
                        src={getImageUrl(formData.thumbnail)}
                        alt="Thumbnail preview"
                        className="w-40 h-28 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, thumbnail: '' })}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Xóa ảnh"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.thumbnail}
                      onChange={(e) =>
                        setFormData({ ...formData, thumbnail: e.target.value })
                      }
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none"
                      placeholder="/uploads/blogs/..."
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleThumbnailUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          Đang tải...
                        </>
                      ) : (
                        <>
                          <HiOutlinePhotograph className="w-5 h-5" />
                          Upload
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Hỗ trợ JPG, PNG, GIF. Tối đa 5MB.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Danh mục
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tags (cách nhau bởi dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none"
                    placeholder="hoa cưới, mâm quả, mẹo hay"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none"
                  >
                    <option value="draft">Bản nháp</option>
                    <option value="published">Xuất bản</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) =>
                        setFormData({ ...formData, featured: e.target.checked })
                      }
                      className="w-5 h-5 rounded text-rose-500 focus:ring-rose-500"
                    />
                    <span className="text-sm font-medium">
                      Đánh dấu là bài viết nổi bật
                    </span>
                  </label>
                </div>

                <div className="md:col-span-2 border-t pt-4">
                  <h3 className="font-medium mb-4">SEO</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={(e) =>
                          setFormData({ ...formData, metaTitle: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none"
                        maxLength={70}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Meta Description
                      </label>
                      <input
                        type="text"
                        value={formData.metaDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metaDescription: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none"
                        maxLength={160}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                >
                  {editingBlog ? 'Cập nhật' : 'Tạo bài viết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
