import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineEye } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { Product, Category } from '@/types';
import { productsAPI, categoriesAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string | number | boolean> = {
        page: currentPage,
        limit: 10,
        all: true, // Show all products including inactive
      };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory !== 'all') {
        // Find category slug from id
        const cat = categories.find(c => c._id === selectedCategory);
        if (cat) params.category = cat.slug;
      }

      const response = await productsAPI.getAll(params);

      if (response.data.success) {
        setProducts(response.data.data);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || response.data.pagination.totalPages || 1);
          setTotalProducts(response.data.pagination.total || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, selectedCategory]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

    try {
      await productsAPI.delete(id);
      toast.success('Đã xóa sản phẩm');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Không thể xóa sản phẩm');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await productsAPI.update(product._id, { isActive: !product.isActive });
      toast.success('Đã cập nhật trạng thái');
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading">Quản Lý Sản Phẩm</h1>
          <p className="text-neutral-500">Quản lý danh mục sản phẩm của cửa hàng</p>
        </div>
        <Link to="/admin/products/new" className="btn btn-primary flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5" />
          Thêm Sản Phẩm
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="input w-auto"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">Sản Phẩm</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">Danh Mục</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">Giá</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">Kho</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">Trạng Thái</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-neutral-500">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(product.images[0])}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-neutral-500">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{product.category?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm font-medium">{product.price.toLocaleString('vi-VN')}đ</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {product.stock === 0 ? 'Hết hàng' : `Còn ${product.stock}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {product.isActive ? 'Đang bán' : 'Tạm ẩn'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/products/${product._id}`}
                            className="p-2 hover:bg-neutral-100 rounded-lg"
                            title="Xem"
                          >
                            <HiOutlineEye className="w-5 h-5 text-neutral-500" />
                          </Link>
                          <Link
                            to={`/admin/products/${product._id}/edit`}
                            className="p-2 hover:bg-neutral-100 rounded-lg"
                            title="Sửa"
                          >
                            <HiOutlinePencil className="w-5 h-5 text-neutral-500" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 hover:bg-red-50 rounded-lg"
                            title="Xóa"
                          >
                            <HiOutlineTrash className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500">Không tìm thấy sản phẩm nào</p>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-neutral-500">
                Hiển thị {products.length} / {totalProducts} sản phẩm
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded hover:bg-neutral-50 disabled:opacity-50"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-primary text-white'
                        : 'border hover:bg-neutral-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded hover:bg-neutral-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
