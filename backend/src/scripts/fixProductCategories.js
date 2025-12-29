/**
 * Script để sửa lỗi category null cho sản phẩm
 * Chạy: node src/scripts/fixProductCategories.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Mapping từ khóa -> category slug (theo thứ tự ưu tiên)
const CATEGORY_KEYWORDS = {
  'mam-qua-cuoi': [
    'mâm quả', 'mam qua', 'tráp', 'trap', 'sính lễ', 'sinh le',
    'lễ ăn hỏi', 'le an hoi', 'đám hỏi', 'dam hoi', 'rồng phượng',
    'rong phuong', 'trầu cau', 'trau cau', 'cau lá', 'cau la'
  ],
  'hoa-cuoi': [
    'hoa cưới', 'hoa cuoi', 'cô dâu', 'co dau', 'chú rể', 'chu re',
    'hoa cầm tay', 'hoa cam tay', 'bridal', 'bouquet cưới', 'wedding'
  ],
  'gio-qua-tet': [
    'quà tết', 'qua tet', 'giỏ quà tết', 'gio qua tet', 'bánh kẹo tết',
    'banh keo tet', 'hoa đào', 'hoa dao', 'năm mới', 'nam moi'
  ],
  'gio-trai-cay': [
    'giỏ trái cây', 'gio trai cay', 'trái cây', 'trai cay', 'tháp trái',
    'thap trai', 'hoa quả', 'hoa qua', 'fruit'
  ],
  'qua-tang': [
    'quà tặng', 'qua tang', 'giỏ quà', 'gio qua', 'sinh nhật', 'sinh nhat',
    'birthday', 'khai trương', 'khai truong', '8/3', 'valentine',
    'yêu thương', 'yeu thuong', 'rượu vang', 'ruou vang', 'yến sào', 'yen sao'
  ],
};

// Normalize Vietnamese text for comparison
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// Find matching category for a product
function findCategoryMatch(product, categories) {
  const productName = normalizeText(product.name);
  const productDesc = normalizeText(product.description);
  const productTags = (product.tags || []).map(t => normalizeText(t)).join(' ');
  const combinedText = `${productName} ${productDesc} ${productTags}`;

  for (const category of categories) {
    const categorySlug = category.slug;
    const keywords = CATEGORY_KEYWORDS[categorySlug] || [];

    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      if (combinedText.includes(normalizedKeyword)) {
        return category;
      }
    }

    // Also check if category name is in product
    if (combinedText.includes(normalizeText(category.name))) {
      return category;
    }
  }

  return null;
}

async function fixCategories() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flower-shop';
    console.log('Connecting to MongoDB:', mongoUri);

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get all categories
    const categories = await Category.find({});
    console.log('\n=== DANH SÁCH CATEGORY ===');
    categories.forEach(cat => {
      console.log(`- ${cat.name} (slug: ${cat.slug}, id: ${cat._id})`);
    });

    if (categories.length === 0) {
      console.log('\n❌ Không có category nào trong database!');
      console.log('Vui lòng import categories trước.');
      process.exit(1);
    }

    // Get all products with null or invalid category
    const products = await Product.find({}).populate('category');
    console.log(`\n=== TỔNG SỐ SẢN PHẨM: ${products.length} ===`);

    const productsWithNullCategory = products.filter(p => !p.category);
    console.log(`Sản phẩm có category null: ${productsWithNullCategory.length}`);

    if (productsWithNullCategory.length === 0) {
      console.log('\n✅ Tất cả sản phẩm đã có category hợp lệ!');
      process.exit(0);
    }

    // Create stats object
    const stats = {
      total: productsWithNullCategory.length,
      fixed: 0,
      failed: 0,
      byCategory: {},
    };

    const failedProducts = [];

    console.log('\n=== BẮT ĐẦU SỬA CATEGORY ===\n');

    for (const product of productsWithNullCategory) {
      const matchedCategory = findCategoryMatch(product, categories);

      if (matchedCategory) {
        await Product.updateOne(
          { _id: product._id },
          { $set: { category: matchedCategory._id } }
        );

        stats.fixed++;
        stats.byCategory[matchedCategory.name] = (stats.byCategory[matchedCategory.name] || 0) + 1;
        console.log(`✅ ${product.name} -> ${matchedCategory.name}`);
      } else {
        stats.failed++;
        failedProducts.push(product);
        console.log(`❌ ${product.name} -> Không tìm thấy category phù hợp`);
      }
    }

    // Summary
    console.log('\n=== KẾT QUẢ ===');
    console.log(`Tổng số xử lý: ${stats.total}`);
    console.log(`Đã sửa: ${stats.fixed}`);
    console.log(`Không xử lý được: ${stats.failed}`);

    console.log('\nPhân bổ theo category:');
    for (const [catName, count] of Object.entries(stats.byCategory)) {
      console.log(`  - ${catName}: ${count} sản phẩm`);
    }

    if (failedProducts.length > 0) {
      console.log('\n=== SẢN PHẨM CẦN XỬ LÝ THỦ CÔNG ===');
      console.log('Các sản phẩm sau cần được gán category thủ công qua admin:');
      failedProducts.forEach(p => {
        console.log(`  - ${p.name} (ID: ${p._id})`);
      });

      // Option: Assign to first category as default
      const defaultCategory = categories[0];
      console.log(`\nGán mặc định vào category "${defaultCategory.name}"? (Uncomment code bên dưới để thực hiện)`);

      // Uncomment to assign default category
      // for (const product of failedProducts) {
      //   await Product.updateOne(
      //     { _id: product._id },
      //     { $set: { category: defaultCategory._id } }
      //   );
      //   console.log(`  Đã gán ${product.name} -> ${defaultCategory.name}`);
      // }
    }

    console.log('\n✅ Hoàn thành!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixCategories();
}

module.exports = { fixCategories, findCategoryMatch, CATEGORY_KEYWORDS };
