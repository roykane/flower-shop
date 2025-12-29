import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  product?: {
    name: string;
    price: number;
    image: string;
    description: string;
    availability?: 'InStock' | 'OutOfStock';
    category?: string;
  };
}

const BASE_URL = 'https://minhanh.store';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const SITE_NAME = 'MINH ANH - Mâm Quả & Hoa Cưới';

export default function SEO({
  title,
  description = 'Dịch vụ Mâm Quả, Hoa Cưới, Cổng Cưới hàng đầu An Giang. Chuyên cung cấp hoa tươi, mâm quả cưới hỏi, trang trí tiệc cưới đẹp, uy tín, giá tốt.',
  keywords = 'mâm quả, hoa cưới, cổng cưới, hoa tươi, an giang, đám cưới, mâm quả cưới hỏi, trang trí tiệc cưới',
  image = DEFAULT_IMAGE,
  url = BASE_URL,
  type = 'website',
  product,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook / Zalo */}
      <meta property="og:type" content={type === 'product' ? 'product' : 'website'} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="vi_VN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Product specific meta tags */}
      {product && (
        <>
          <meta property="product:price:amount" content={product.price.toString()} />
          <meta property="product:price:currency" content="VND" />
          <meta property="og:price:amount" content={product.price.toString()} />
          <meta property="og:price:currency" content="VND" />
        </>
      )}

      {/* Product Structured Data */}
      {product && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            image: fullImage,
            description: product.description,
            brand: {
              '@type': 'Brand',
              name: 'MINH ANH',
            },
            offers: {
              '@type': 'Offer',
              url: fullUrl,
              priceCurrency: 'VND',
              price: product.price,
              availability: `https://schema.org/${product.availability || 'InStock'}`,
              seller: {
                '@type': 'Organization',
                name: SITE_NAME,
              },
            },
            category: product.category,
          })}
        </script>
      )}
    </Helmet>
  );
}
