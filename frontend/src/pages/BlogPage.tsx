import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineCalendar, HiOutlineEye, HiOutlineTag, HiOutlineSearch } from 'react-icons/hi';
import SEO from '@/components/SEO';
import { getImageUrl } from '@/utils/helpers';
import { blogsAPI } from '@/utils/api';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string;
  category: string;
  tags: string[];
  views: number;
  publishedAt: string;
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

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [featuredBlogs, setFeaturedBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, any> = {
          page: currentPage,
          limit: 9,
        };
        if (selectedCategory) params.category = selectedCategory;
        if (searchQuery) params.search = searchQuery;

        const response = await blogsAPI.getAll(params);
        if (response.data.success) {
          setBlogs(response.data.data);
          setTotalPages(response.data.pagination.pages);
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, [currentPage, selectedCategory, searchQuery]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await blogsAPI.getFeatured(3);
        if (response.data.success) {
          setFeaturedBlogs(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching featured blogs:', error);
      }
    };

    fetchFeatured();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <>
      <SEO
        title="Blog"
        description="Cập nhật tin tức mới nhất về hoa cưới, mâm quả, mẹo trang trí tiệc cưới và các xu hướng cưới hỏi tại An Giang."
        keywords="blog hoa cưới, tin tức mâm quả, mẹo trang trí, xu hướng cưới, an giang"
        url="/blog"
      />

      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="text-sm text-white/80 mb-4">
              <Link to="/" className="hover:text-white">Trang Chủ</Link>
              <span className="mx-2">/</span>
              <span>Blog</span>
            </nav>
            <h1 className="font-heading text-4xl md:text-5xl mb-4">Blog & Tin Tức</h1>
            <p className="text-white/90 max-w-2xl">
              Cập nhật những thông tin mới nhất về xu hướng hoa cưới, mâm quả, mẹo trang trí và các sự kiện từ MINH ANH.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Featured Blogs */}
          {featuredBlogs.length > 0 && (
            <section className="mb-16">
              <h2 className="font-heading text-2xl mb-6 flex items-center gap-2">
                <span className="text-rose-500">★</span> Bài Viết Nổi Bật
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {featuredBlogs.map((blog, index) => (
                  <Link
                    key={blog._id}
                    to={`/blog/${blog.slug}`}
                    className={`group relative overflow-hidden rounded-2xl ${
                      index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                    }`}
                  >
                    <div className={`aspect-[16/9] ${index === 0 ? 'md:aspect-auto md:h-full' : ''}`}>
                      <img
                        src={getImageUrl(blog.thumbnail)}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <span className="inline-block px-3 py-1 bg-rose-500 text-sm rounded-full mb-3">
                        {CATEGORY_LABELS[blog.category] || blog.category}
                      </span>
                      <h3 className={`font-heading ${index === 0 ? 'text-2xl md:text-3xl' : 'text-lg'} mb-2 group-hover:text-rose-200 transition-colors`}>
                        {blog.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-white/80">
                        <span className="flex items-center gap-1">
                          <HiOutlineCalendar />
                          {formatDate(blog.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiOutlineEye />
                          {blog.views} lượt xem
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
                />
              </div>
            </form>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  selectedCategory === ''
                    ? 'bg-rose-500 text-white'
                    : 'bg-white border border-neutral-200 hover:border-rose-300'
                }`}
              >
                Tất cả
              </button>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedCategory(key);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedCategory === key
                      ? 'bg-rose-500 text-white'
                      : 'bg-white border border-neutral-200 hover:border-rose-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Blog Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[16/10] bg-neutral-200 rounded-2xl mb-4" />
                  <div className="h-4 bg-neutral-200 rounded w-1/4 mb-3" />
                  <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-neutral-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-heading mb-2">Chưa có bài viết nào</h3>
              <p className="text-neutral-500">
                {searchQuery || selectedCategory
                  ? 'Không tìm thấy bài viết phù hợp. Thử tìm với từ khóa khác.'
                  : 'Các bài viết sẽ sớm được cập nhật.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-8">
                {blogs.map((blog) => (
                  <article key={blog._id} className="group">
                    <Link to={`/blog/${blog.slug}`}>
                      <div className="aspect-[16/10] rounded-2xl overflow-hidden mb-4 bg-neutral-100">
                        <img
                          src={getImageUrl(blog.thumbnail)}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </Link>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-rose-100 text-rose-600 text-xs rounded-full">
                        {CATEGORY_LABELS[blog.category] || blog.category}
                      </span>
                      <span className="text-sm text-neutral-500 flex items-center gap-1">
                        <HiOutlineCalendar className="w-4 h-4" />
                        {formatDate(blog.publishedAt)}
                      </span>
                    </div>
                    <Link to={`/blog/${blog.slug}`}>
                      <h3 className="font-heading text-xl mb-2 group-hover:text-rose-500 transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                    </Link>
                    <p className="text-neutral-600 text-sm line-clamp-2 mb-3">
                      {blog.excerpt}
                    </p>
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <HiOutlineTag className="w-4 h-4 text-neutral-400" />
                        {blog.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs text-neutral-500">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-rose-300"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        currentPage === page
                          ? 'bg-rose-500 text-white'
                          : 'border border-neutral-200 hover:border-rose-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-rose-300"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
