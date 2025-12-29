import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HiOutlineCalendar,
  HiOutlineEye,
  HiOutlineTag,
  HiOutlineShare,
  HiOutlineArrowLeft,
  HiOutlineHeart,
} from 'react-icons/hi';
import { PiFlowerLotus, PiFlowerTulip } from 'react-icons/pi';
import SEO from '@/components/SEO';
import { getImageUrl, API_URL } from '@/utils/helpers';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  images: string[];
  category: string;
  tags: string[];
  views: number;
  publishedAt: string;
  metaTitle?: string;
  metaDescription?: string;
  author?: {
    name: string;
  };
}

interface RelatedBlog {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string;
  publishedAt: string;
  category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'tin-tuc': 'Tin Tức',
  'huong-dan': 'Hướng Dẫn',
  'meo-hay': 'Mẹo Hay',
  'su-kien': 'Sự Kiện',
  'khac': 'Khác',
};

// Decorative Flower Components
const FloralDecorLeft = () => (
  <svg className="floral-decor-left" viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 200 Q80 150 60 100 Q90 130 100 80 Q110 130 140 100 Q120 150 150 200" 
          stroke="var(--color-rose-200)" strokeWidth="1.5" fill="none" opacity="0.6"/>
    <circle cx="100" cy="80" r="20" fill="var(--color-rose-100)" opacity="0.5"/>
    <path d="M30 300 Q60 260 50 220 Q80 250 90 210" 
          stroke="var(--color-sage-200)" strokeWidth="1" fill="none" opacity="0.4"/>
    <ellipse cx="50" cy="320" rx="15" ry="25" fill="var(--color-sage-100)" opacity="0.3"/>
  </svg>
);

const FloralDecorRight = () => (
  <svg className="floral-decor-right" viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M150 200 Q120 150 140 100 Q110 130 100 80 Q90 130 60 100 Q80 150 50 200" 
          stroke="var(--color-rose-200)" strokeWidth="1.5" fill="none" opacity="0.6"/>
    <circle cx="100" cy="80" r="20" fill="var(--color-blush-100)" opacity="0.5"/>
    <path d="M170 280 Q140 240 150 200 Q120 230 110 190" 
          stroke="var(--color-sage-200)" strokeWidth="1" fill="none" opacity="0.4"/>
  </svg>
);

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<RelatedBlog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  useEffect(() => {
    const fetchBlog = async () => {
      if (!slug) return;

      setIsLoading(true);
      try {
        const response = await axios.get<{
          success: boolean;
          data: { blog: Blog; related: RelatedBlog[] };
        }>(`${API_URL}/api/blogs/${slug}`);

        if (response.data.success) {
          setBlog(response.data.data.blog);
          setRelatedBlogs(response.data.data.related);
        }
      } catch (error) {
        console.error('Error fetching blog:', error);
        setBlog(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
    window.scrollTo(0, 0);
  }, [slug]);

  const handleShare = async () => {
    if (!blog) return;

    const shareData = {
      title: blog.title,
      text: blog.excerpt || blog.title,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Đã sao chép liên kết!');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Đã sao chép liên kết!');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="blog-detail-page">
        <style>{styles}</style>
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-flower">
              <PiFlowerLotus className="flower-icon spinning" />
            </div>
            <p className="loading-text">Đang tải bài viết...</p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="blog-detail-page">
        <style>{styles}</style>
        <div className="not-found-container">
          <div className="not-found-content">
            <PiFlowerTulip className="not-found-icon" />
            <h1>Không tìm thấy bài viết</h1>
            <p>Bài viết bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
            <Link to="/blog" className="back-to-blog-btn">
              <HiOutlineArrowLeft />
              Xem tất cả bài viết
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={blog.metaTitle || blog.title}
        description={blog.metaDescription || blog.excerpt || blog.title}
        keywords={blog.tags?.join(', ') || 'blog, tin tức, mâm quả, hoa cưới'}
        image={getImageUrl(blog.thumbnail)}
        url={`/blog/${blog.slug}`}
        type="article"
      />

      <article className="blog-detail-page">
        <style>{styles}</style>
        
        {/* Decorative Background */}
        <div className="decorative-bg">
          <FloralDecorLeft />
          <FloralDecorRight />
          <div className="floating-petals">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`petal petal-${i + 1}`} />
            ))}
          </div>
        </div>

        {/* Hero Header */}
        <header className="blog-header">
          <div className="header-container">
            {/* Navigation */}
            <nav className="blog-nav">
              <Link to="/blog" className="back-link">
                <HiOutlineArrowLeft />
                <span>Quay lại Blog</span>
              </Link>
              
              <div className="breadcrumb">
                <Link to="/">Trang Chủ</Link>
                <span className="separator">
                  <PiFlowerLotus />
                </span>
                <Link to="/blog">Blog</Link>
                <span className="separator">
                  <PiFlowerLotus />
                </span>
                <span className="current">{blog.title}</span>
              </div>
            </nav>

            {/* Category Badge */}
            <div className="category-badge">
              <span className="badge-icon">❀</span>
              <span>{CATEGORY_LABELS[blog.category] || blog.category}</span>
            </div>

            {/* Title */}
            <h1 className="blog-title">{blog.title}</h1>

            {/* Meta Info */}
            <div className="blog-meta">
              <div className="meta-item">
                <HiOutlineCalendar />
                <span>{formatDate(blog.publishedAt)}</span>
              </div>
              <div className="meta-divider">✿</div>
              <div className="meta-item">
                <HiOutlineEye />
                <span>{blog.views} lượt xem</span>
              </div>
              {blog.author && (
                <>
                  <div className="meta-divider">✿</div>
                  <div className="meta-item author">
                    <div className="author-avatar">
                      {blog.author.name.charAt(0)}
                    </div>
                    <span>{blog.author.name}</span>
                  </div>
                </>
              )}
            </div>

            {/* Share Button */}
            <button onClick={handleShare} className="share-btn">
              <HiOutlineShare />
              <span>Chia sẻ</span>
            </button>
          </div>
        </header>

        {/* Featured Image */}
        <section className="featured-image-section">
          <div className="featured-image-container">
            <div className="image-frame">
              <div className="frame-corner top-left" />
              <div className="frame-corner top-right" />
              <div className="frame-corner bottom-left" />
              <div className="frame-corner bottom-right" />
              <img
                src={getImageUrl(blog.thumbnail)}
                alt={blog.title}
                className="featured-image"
              />
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="blog-content-section">
          <div className="content-container">
            {/* Excerpt */}
            {blog.excerpt && (
              <blockquote className="blog-excerpt">
                <div className="excerpt-decoration">
                  <HiOutlineHeart />
                </div>
                <p>{blog.excerpt}</p>
              </blockquote>
            )}

            {/* Main Content */}
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="tags-section">
                <div className="tags-header">
                  <HiOutlineTag />
                  <span>Thẻ bài viết</span>
                </div>
                <div className="tags-list">
                  {blog.tags.map((tag) => (
                    <Link key={tag} to={`/blog?tag=${tag}`} className="tag-item">
                      <span className="tag-hash">#</span>
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Share CTA */}
            <div className="share-cta">
              <div className="cta-decoration">
                <PiFlowerTulip />
              </div>
              <h3>Bạn thấy bài viết hữu ích?</h3>
              <p>Hãy chia sẻ cho bạn bè và người thân nhé!</p>
              <button onClick={handleShare} className="cta-share-btn">
                <HiOutlineShare />
                <span>Chia sẻ bài viết</span>
              </button>
            </div>
          </div>
        </section>

        {/* Related Blogs */}
        {relatedBlogs.length > 0 && (
          <section className="related-section">
            <div className="related-container">
              <div className="section-header">
                <div className="header-decoration left">
                  <span>❀</span>
                  <span>✿</span>
                  <span>❀</span>
                </div>
                <h2>Bài Viết Liên Quan</h2>
                <div className="header-decoration right">
                  <span>❀</span>
                  <span>✿</span>
                  <span>❀</span>
                </div>
              </div>
              
              <div className="related-grid">
                {relatedBlogs.map((related, index) => (
                  <Link 
                    key={related._id} 
                    to={`/blog/${related.slug}`} 
                    className="related-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="card-image">
                      <img
                        src={getImageUrl(related.thumbnail)}
                        alt={related.title}
                      />
                      <div className="card-overlay">
                        <span className="read-more">Đọc thêm ❀</span>
                      </div>
                    </div>
                    <div className="card-content">
                      <span className="card-category">
                        {CATEGORY_LABELS[related.category] || related.category}
                      </span>
                      <h3 className="card-title">{related.title}</h3>
                      <span className="card-date">
                        <HiOutlineCalendar />
                        {formatDate(related.publishedAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </>
  );
}

// Styles
const styles = `
  /* CSS Variables - Bảng màu hồng pastel & hoa lá */
  :root {
    --color-rose-50: #FFF5F7;
    --color-rose-100: #FFE4EC;
    --color-rose-200: #FFCCD9;
    --color-rose-300: #FFB3C6;
    --color-rose-400: #FF8FAB;
    --color-rose-500: #E8789A;
    --color-rose-600: #D45D7E;
    
    --color-blush-50: #FFF9F5;
    --color-blush-100: #FFF0E8;
    --color-blush-200: #FFE4D6;
    
    --color-cream-50: #FFFDF9;
    --color-cream-100: #FFF8EE;
    --color-cream-200: #FFF3E0;
    
    --color-sage-50: #F5FAF7;
    --color-sage-100: #E8F5EC;
    --color-sage-200: #D0EBD8;
    --color-sage-300: #A8D5BA;
    
    --color-lavender-50: #FAF5FF;
    --color-lavender-100: #F3E8FF;
    
    --color-text-primary: #4A3F45;
    --color-text-secondary: #7A6B72;
    --color-text-light: #A89A9F;
    
    --font-heading: 'Poppins', system-ui, sans-serif;
    --font-body: 'Poppins', system-ui, sans-serif;
    
    --shadow-soft: 0 4px 20px rgba(232, 120, 154, 0.08);
    --shadow-medium: 0 8px 30px rgba(232, 120, 154, 0.12);
    --shadow-float: 0 12px 40px rgba(232, 120, 154, 0.15);
    
    --radius-sm: 8px;
    --radius-md: 16px;
    --radius-lg: 24px;
    --radius-xl: 32px;
    --radius-full: 9999px;
    
    --transition-smooth: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-bounce: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Base Styles */
  .blog-detail-page {
    font-family: var(--font-body);
    color: var(--color-text-primary);
    background: linear-gradient(
      180deg,
      var(--color-rose-50) 0%,
      var(--color-cream-50) 30%,
      #FFFFFF 60%,
      var(--color-sage-50) 100%
    );
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  /* Decorative Background */
  .decorative-bg {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .floral-decor-left,
  .floral-decor-right {
    position: absolute;
    width: 200px;
    height: 400px;
    opacity: 0.4;
  }

  .floral-decor-left {
    left: 0;
    top: 15%;
  }

  .floral-decor-right {
    right: 0;
    top: 40%;
    transform: scaleX(-1);
  }

  /* Floating Petals Animation */
  .floating-petals {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .petal {
    position: absolute;
    width: 12px;
    height: 12px;
    background: var(--color-rose-200);
    border-radius: 50% 0 50% 50%;
    opacity: 0.3;
    animation: floatPetal 15s ease-in-out infinite;
  }

  .petal-1 { left: 10%; top: 20%; animation-delay: 0s; }
  .petal-2 { left: 85%; top: 35%; animation-delay: 2s; background: var(--color-sage-200); }
  .petal-3 { left: 20%; top: 60%; animation-delay: 4s; }
  .petal-4 { left: 75%; top: 70%; animation-delay: 6s; background: var(--color-blush-200); }
  .petal-5 { left: 5%; top: 80%; animation-delay: 8s; }
  .petal-6 { left: 90%; top: 15%; animation-delay: 10s; background: var(--color-lavender-100); }

  @keyframes floatPetal {
    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
    50% { transform: translateY(-30px) rotate(180deg); opacity: 0.5; }
  }

  /* Loading State */
  .loading-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-rose-50), var(--color-cream-50));
  }

  .loading-content {
    text-align: center;
    padding: 3rem;
  }

  .loading-flower {
    margin-bottom: 1.5rem;
  }

  .flower-icon {
    font-size: 4rem;
    color: var(--color-rose-400);
  }

  .flower-icon.spinning {
    animation: gentleSpin 3s ease-in-out infinite;
  }

  @keyframes gentleSpin {
    0%, 100% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.1); }
  }

  .loading-text {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    color: var(--color-text-secondary);
    margin-bottom: 1rem;
  }

  .loading-dots {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .loading-dots span {
    width: 8px;
    height: 8px;
    background: var(--color-rose-300);
    border-radius: 50%;
    animation: dotPulse 1.4s ease-in-out infinite;
  }

  .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes dotPulse {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
  }

  /* Not Found State */
  .not-found-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
  }

  .not-found-content {
    max-width: 400px;
  }

  .not-found-icon {
    font-size: 5rem;
    color: var(--color-rose-300);
    margin-bottom: 1.5rem;
  }

  .not-found-content h1 {
    font-family: var(--font-heading);
    font-size: 1.75rem;
    color: var(--color-text-primary);
    margin-bottom: 0.75rem;
  }

  .not-found-content p {
    color: var(--color-text-secondary);
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .back-to-blog-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.75rem;
    background: linear-gradient(135deg, var(--color-rose-400), var(--color-rose-500));
    color: white;
    border-radius: var(--radius-full);
    font-weight: 600;
    text-decoration: none;
    transition: var(--transition-smooth);
    box-shadow: var(--shadow-soft);
  }

  .back-to-blog-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
  }

  /* Blog Header */
  .blog-header {
    position: relative;
    z-index: 1;
    padding: 2rem 0 3rem;
    background: linear-gradient(
      to bottom,
      var(--color-rose-50) 0%,
      transparent 100%
    );
  }

  .header-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 1.5rem;
    text-align: center;
  }

  /* Navigation */
  .blog-nav {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 0.9rem;
    transition: var(--transition-smooth);
    align-self: flex-start;
  }

  .back-link:hover {
    color: var(--color-rose-500);
    transform: translateX(-4px);
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.85rem;
  }

  .breadcrumb a {
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: var(--transition-smooth);
  }

  .breadcrumb a:hover {
    color: var(--color-rose-500);
  }

  .breadcrumb .separator {
    color: var(--color-rose-300);
    font-size: 0.7rem;
  }

  .breadcrumb .current {
    color: var(--color-text-primary);
    font-weight: 500;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Category Badge */
  .category-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.25rem;
    background: linear-gradient(135deg, var(--color-rose-100), var(--color-blush-100));
    border: 1px solid var(--color-rose-200);
    border-radius: var(--radius-full);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-rose-600);
    margin-bottom: 1.5rem;
  }

  .badge-icon {
    font-size: 1rem;
  }

  /* Blog Title */
  .blog-title {
    font-family: var(--font-heading);
    font-size: clamp(1.75rem, 5vw, 3rem);
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-text-primary);
    margin-bottom: 1.5rem;
    letter-spacing: -0.02em;
  }

  /* Blog Meta */
  .blog-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }

  .meta-item svg {
    color: var(--color-rose-400);
    font-size: 1.1rem;
  }

  .meta-divider {
    color: var(--color-rose-300);
    font-size: 0.8rem;
  }

  .author-avatar {
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, var(--color-rose-300), var(--color-rose-400));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 0.8rem;
  }

  /* Share Button */
  .share-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.5rem;
    background: white;
    border: 1.5px solid var(--color-rose-200);
    border-radius: var(--radius-full);
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .share-btn:hover {
    border-color: var(--color-rose-400);
    color: var(--color-rose-500);
    background: var(--color-rose-50);
    transform: translateY(-2px);
    box-shadow: var(--shadow-soft);
  }

  /* Featured Image */
  .featured-image-section {
    position: relative;
    z-index: 1;
    padding: 0 1.5rem;
    margin-top: -1rem;
  }

  .featured-image-container {
    max-width: 1000px;
    margin: 0 auto;
  }

  .image-frame {
    position: relative;
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-float);
    background: white;
    padding: 8px;
  }

  .frame-corner {
    position: absolute;
    width: 40px;
    height: 40px;
    z-index: 2;
  }

  .frame-corner::before,
  .frame-corner::after {
    content: '';
    position: absolute;
    background: var(--color-rose-300);
    opacity: 0.6;
  }

  .frame-corner.top-left { top: 12px; left: 12px; }
  .frame-corner.top-left::before { width: 20px; height: 2px; top: 0; left: 0; }
  .frame-corner.top-left::after { width: 2px; height: 20px; top: 0; left: 0; }

  .frame-corner.top-right { top: 12px; right: 12px; }
  .frame-corner.top-right::before { width: 20px; height: 2px; top: 0; right: 0; }
  .frame-corner.top-right::after { width: 2px; height: 20px; top: 0; right: 0; }

  .frame-corner.bottom-left { bottom: 12px; left: 12px; }
  .frame-corner.bottom-left::before { width: 20px; height: 2px; bottom: 0; left: 0; }
  .frame-corner.bottom-left::after { width: 2px; height: 20px; bottom: 0; left: 0; }

  .frame-corner.bottom-right { bottom: 12px; right: 12px; }
  .frame-corner.bottom-right::before { width: 20px; height: 2px; bottom: 0; right: 0; }
  .frame-corner.bottom-right::after { width: 2px; height: 20px; bottom: 0; right: 0; }

  .featured-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: var(--radius-lg);
  }

  /* Blog Content */
  .blog-content-section {
    position: relative;
    z-index: 1;
    padding: 4rem 1.5rem;
  }

  .content-container {
    max-width: 720px;
    margin: 0 auto;
  }

  /* Excerpt */
  .blog-excerpt {
    position: relative;
    margin: 0 0 3rem;
    padding: 2rem 2rem 2rem 2.5rem;
    background: linear-gradient(135deg, var(--color-rose-50), var(--color-cream-50));
    border-radius: var(--radius-lg);
    border-left: 4px solid var(--color-rose-300);
  }

  .excerpt-decoration {
    position: absolute;
    top: -12px;
    left: 20px;
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, var(--color-rose-300), var(--color-rose-400));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.9rem;
  }

  .blog-excerpt p {
    font-family: var(--font-heading);
    font-size: 1.2rem;
    font-style: italic;
    line-height: 1.8;
    color: var(--color-text-secondary);
    margin: 0;
  }

  /* Main Content */
  .blog-content {
    font-size: 1.0625rem;
    line-height: 1.9;
    color: var(--color-text-primary);
  }

  .blog-content h1,
  .blog-content h2,
  .blog-content h3,
  .blog-content h4,
  .blog-content h5,
  .blog-content h6 {
    font-family: var(--font-heading);
    color: var(--color-text-primary);
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    line-height: 1.4;
  }

  .blog-content h2 {
    font-size: 1.625rem;
    position: relative;
    padding-left: 1rem;
  }

  .blog-content h2::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 60%;
    background: linear-gradient(to bottom, var(--color-rose-300), var(--color-rose-400));
    border-radius: 2px;
  }

  .blog-content h3 {
    font-size: 1.375rem;
  }

  .blog-content p {
    margin-bottom: 1.5rem;
  }

  .blog-content a {
    color: var(--color-rose-500);
    text-decoration: none;
    border-bottom: 1px solid var(--color-rose-200);
    transition: var(--transition-smooth);
  }

  .blog-content a:hover {
    color: var(--color-rose-600);
    border-bottom-color: var(--color-rose-400);
  }

  .blog-content img {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-medium);
    margin: 2rem 0;
  }

  .blog-content ul,
  .blog-content ol {
    margin: 1.5rem 0;
    padding-left: 1.5rem;
  }

  .blog-content li {
    margin-bottom: 0.75rem;
    position: relative;
  }

  .blog-content ul li::marker {
    color: var(--color-rose-400);
  }

  .blog-content blockquote {
    margin: 2rem 0;
    padding: 1.5rem 2rem;
    background: var(--color-cream-50);
    border-left: 4px solid var(--color-sage-300);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    font-style: italic;
    color: var(--color-text-secondary);
  }

  /* Tags Section */
  .tags-section {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px dashed var(--color-rose-200);
  }

  .tags-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .tags-header svg {
    color: var(--color-rose-400);
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .tag-item {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    background: white;
    border: 1px solid var(--color-rose-100);
    border-radius: var(--radius-full);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    text-decoration: none;
    transition: var(--transition-smooth);
  }

  .tag-item:hover {
    background: var(--color-rose-50);
    border-color: var(--color-rose-300);
    color: var(--color-rose-600);
    transform: translateY(-2px);
  }

  .tag-hash {
    color: var(--color-rose-400);
    margin-right: 2px;
  }

  /* Share CTA */
  .share-cta {
    margin-top: 3rem;
    padding: 2.5rem;
    background: linear-gradient(135deg, var(--color-rose-50), var(--color-blush-50), var(--color-cream-50));
    border-radius: var(--radius-xl);
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .share-cta::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--color-rose-300), var(--color-sage-300), var(--color-rose-300));
  }

  .cta-decoration {
    font-size: 2.5rem;
    color: var(--color-rose-300);
    margin-bottom: 1rem;
  }

  .share-cta h3 {
    font-family: var(--font-heading);
    font-size: 1.375rem;
    color: var(--color-text-primary);
    margin-bottom: 0.5rem;
  }

  .share-cta p {
    color: var(--color-text-secondary);
    margin-bottom: 1.5rem;
  }

  .cta-share-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 2rem;
    background: linear-gradient(135deg, var(--color-rose-400), var(--color-rose-500));
    color: white;
    border: none;
    border-radius: var(--radius-full);
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-bounce);
    box-shadow: var(--shadow-soft);
  }

  .cta-share-btn:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: var(--shadow-medium);
  }

  /* Related Section */
  .related-section {
    position: relative;
    z-index: 1;
    padding: 4rem 1.5rem;
    background: linear-gradient(
      to bottom,
      var(--color-cream-50) 0%,
      var(--color-sage-50) 100%
    );
  }

  .related-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .header-decoration {
    display: flex;
    gap: 0.5rem;
    color: var(--color-rose-300);
    font-size: 0.875rem;
  }

  .section-header h2 {
    font-family: var(--font-heading);
    font-size: 1.75rem;
    color: var(--color-text-primary);
    margin: 0;
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.5rem;
  }

  .related-card {
    background: white;
    border-radius: var(--radius-lg);
    overflow: hidden;
    text-decoration: none;
    box-shadow: var(--shadow-soft);
    transition: var(--transition-smooth);
    animation: fadeInUp 0.6s ease-out forwards;
    opacity: 0;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .related-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-float);
  }

  .card-image {
    position: relative;
    aspect-ratio: 16 / 10;
    overflow: hidden;
  }

  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: var(--transition-smooth);
  }

  .related-card:hover .card-image img {
    transform: scale(1.08);
  }

  .card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(232, 120, 154, 0.8), transparent 60%);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 1rem;
    opacity: 0;
    transition: var(--transition-smooth);
  }

  .related-card:hover .card-overlay {
    opacity: 1;
  }

  .read-more {
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .card-content {
    padding: 1.25rem;
  }

  .card-category {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-rose-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .card-title {
    font-family: var(--font-heading);
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.4;
    margin-bottom: 0.75rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: var(--transition-smooth);
  }

  .related-card:hover .card-title {
    color: var(--color-rose-500);
  }

  .card-date {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: var(--color-text-light);
  }

  .card-date svg {
    font-size: 0.9rem;
    color: var(--color-rose-300);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .blog-header {
      padding: 1.5rem 0 2rem;
    }

    .blog-nav {
      gap: 0.75rem;
    }

    .breadcrumb {
      font-size: 0.8rem;
    }

    .blog-title {
      font-size: 1.5rem;
    }

    .blog-meta {
      gap: 0.75rem;
    }

    .meta-item {
      font-size: 0.8rem;
    }

    .featured-image-section {
      padding: 0 1rem;
    }

    .image-frame {
      padding: 4px;
      border-radius: var(--radius-lg);
    }

    .featured-image {
      border-radius: var(--radius-md);
    }

    .frame-corner {
      display: none;
    }

    .blog-content-section {
      padding: 2.5rem 1rem;
    }

    .blog-excerpt {
      padding: 1.5rem 1.5rem 1.5rem 1.75rem;
    }

    .blog-excerpt p {
      font-size: 1.0625rem;
    }

    .blog-content {
      font-size: 1rem;
    }

    .blog-content h2 {
      font-size: 1.375rem;
    }

    .share-cta {
      padding: 2rem 1.5rem;
    }

    .section-header {
      flex-direction: column;
      gap: 0.75rem;
    }

    .header-decoration {
      display: none;
    }

    .related-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .floral-decor-left,
    .floral-decor-right {
      opacity: 0.2;
      width: 150px;
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    .related-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Print Styles */
  @media print {
    .decorative-bg,
    .floating-petals,
    .share-btn,
    .share-cta,
    .related-section,
    .back-link {
      display: none !important;
    }

    .blog-detail-page {
      background: white !important;
    }
  }
`;