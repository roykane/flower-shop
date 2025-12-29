const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Category = require('../models/Category');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flower-shop';

// Danh mục
const categories = [
  {
    name: 'Mâm Quả Cưới',
    slug: 'mam-qua-cuoi',
    description: 'Mâm quả truyền thống cho lễ ăn hỏi, đám cưới',
    image: '/uploads/592204609_1530122611953379_2439974153919650602_n.jpg',
  },
  {
    name: 'Giỏ Quà Tết',
    slug: 'gio-qua-tet',
    description: 'Giỏ quà sang trọng dịp Tết Nguyên Đán',
    image: '/uploads/594275383_1534065998225707_1787392301771161655_n.jpg',
  },
  {
    name: 'Giỏ Trái Cây',
    slug: 'gio-trai-cay',
    description: 'Giỏ trái cây tươi kết hợp hoa trang trí',
    image: '/uploads/597323554_1538325517799755_8209913830030218240_n.jpg',
  },
  {
    name: 'Hoa Cưới',
    slug: 'hoa-cuoi',
    description: 'Hoa cầm tay cô dâu, hoa cài áo',
    image: '/uploads/595151883_1536096181356022_3910860693793482297_n.jpg',
  },
  {
    name: 'Quà Tặng',
    slug: 'qua-tang',
    description: 'Giỏ quà bánh kẹo, rượu cho các dịp đặc biệt',
    image: '/uploads/595155000_1538325424466431_8982145334792521892_n.jpg',
  },
];

// Sản phẩm
const products = [
  // Mâm Quả Cưới
  {
    name: 'Mâm Quả Cưới Rồng Phượng',
    slug: 'mam-qua-cuoi-rong-phuong',
    description: 'Bộ mâm quả 6 tráp truyền thống với trang trí rồng phượng vàng kim, trái cây tươi ngon, bánh kẹo cao cấp. Phù hợp cho lễ ăn hỏi sang trọng, thể hiện sự trân trọng và lòng thành kính.',
    price: 3500000,
    images: ['/uploads/592204609_1530122611953379_2439974153919650602_n.jpg'],
    category: 'mam-qua-cuoi',
    stock: 10,
    isFeatured: true,
  },
  {
    name: 'Mâm Quả Cưới Truyền Thống',
    slug: 'mam-qua-cuoi-truyen-thong',
    description: 'Bộ mâm quả 5 tráp với hoa đỏ rực rỡ, trái cây tươi, quạt giấy, rượu vang. Thiết kế cổ điển, đậm nét văn hóa Việt Nam truyền thống.',
    price: 2800000,
    images: ['/uploads/590894285_1528312828801024_6091125474842967440_n.jpg'],
    category: 'mam-qua-cuoi',
    stock: 10,
    isFeatured: true,
  },
  {
    name: 'Tráp Trầu Cau Lá Trầu',
    slug: 'trap-trau-cau-la-trau',
    description: 'Tráp trầu cau trang trí hoa hồng trắng thanh khiết, lá trầu xanh mướt tươi mát. Biểu tượng của tình yêu bền vững và hạnh phúc lâu dài.',
    price: 800000,
    images: ['/uploads/596297133_1538325617799745_7232628115908298809_n.jpg'],
    category: 'mam-qua-cuoi',
    stock: 15,
  },
  {
    name: 'Tráp Rượu Hoa Hồng',
    slug: 'trap-ruou-hoa-hong',
    description: 'Tráp rượu vang trang trí hoa hồng kem, cúc xanh tươi, quạt giấy truyền thống. Sang trọng, tinh tế và đầy ý nghĩa.',
    price: 1200000,
    images: ['/uploads/595272272_1538325467799760_6104288767912460173_n.jpg'],
    category: 'mam-qua-cuoi',
    stock: 12,
  },
  {
    name: 'Tráp Bánh Kẹo Hoa Tươi',
    slug: 'trap-banh-keo-hoa-tuoi',
    description: 'Tráp bánh kẹo cao cấp nhập khẩu kết hợp hoa hồng tươi và baby breath. Ngọt ngào như tình yêu đôi lứa.',
    price: 1000000,
    images: ['/uploads/596337368_1538325584466415_2411576524127910087_n.jpg'],
    category: 'mam-qua-cuoi',
    stock: 15,
  },
  {
    name: 'Tráp Yến Sào Hoa Hồng',
    slug: 'trap-yen-sao-hoa-hong',
    description: 'Tráp yến sào cao cấp trang trí hoa hồng kem nhẹ nhàng, cúc xanh tươi mát. Thể hiện sự quý mến và chăm sóc sức khỏe.',
    price: 2500000,
    images: ['/uploads/597384048_1538325561133084_4572717595111049859_n.jpg'],
    category: 'mam-qua-cuoi',
    stock: 8,
  },
  {
    name: 'Tráp Bia Tiger Đám Hỏi',
    slug: 'trap-bia-tiger-dam-hoi',
    description: 'Tráp bia Tiger xếp tháp độc đáo trang trí hoa hồng, cúc xanh. Phong cách hiện đại, trẻ trung cho đám hỏi.',
    price: 900000,
    images: ['/uploads/597392415_1538325547799752_9100034466391364276_n.jpg'],
    category: 'mam-qua-cuoi',
    stock: 10,
  },
  {
    name: 'Tráp Bánh LU Hoa Tươi',
    slug: 'trap-banh-lu-hoa-tuoi',
    description: 'Tráp bánh LU Pháp cao cấp với hoa hồng trắng thanh khiết, baby breath tinh tế. Đẳng cấp và sang trọng.',
    price: 1100000,
    images: ['/uploads/597899695_1538325494466424_7865535260320421510_n.jpg'],
    category: 'mam-qua-cuoi',
    stock: 12,
  },
  {
    name: 'Bộ Tráp Cưới 5 Lễ',
    slug: 'bo-trap-cuoi-5-le',
    description: 'Bộ 5 tráp đầy đủ cho lễ ăn hỏi: trầu cau, trái cây, bánh kẹo, rượu, yến sào. Trọn vẹn và chu đáo cho ngày vui trọng đại.',
    price: 4500000,
    images: ['/uploads/599128253_1538325364466437_4194744862644637151_n.jpg'],
    category: 'mam-qua-cuoi',
    stock: 5,
    isFeatured: true,
  },

  // Giỏ Quà Tết
  {
    name: 'Giỏ Quà Tết Đỏ Phú Quý',
    slug: 'gio-qua-tet-do-phu-quy',
    description: 'Giỏ quà Tết màu đỏ truyền thống với bánh kẹo nhập khẩu, chocolate Ferrero Rocher, mèo thần tài may mắn. Mang đến phú quý cả năm.',
    price: 1500000,
    images: ['/uploads/594275383_1534065998225707_1787392301771161655_n.jpg'],
    category: 'gio-qua-tet',
    stock: 20,
    isFeatured: true,
  },
  {
    name: 'Giỏ Quà Tết Xanh Thịnh Vượng',
    slug: 'gio-qua-tet-xanh-thinh-vuong',
    description: 'Giỏ quà Tết tông xanh sang trọng với rượu vang 1989, chocolate cao cấp, hoa lan trắng. Đẳng cấp và khác biệt.',
    price: 1800000,
    images: ['/uploads/593605143_1534065718225735_3470327571405371087_n.jpg'],
    category: 'gio-qua-tet',
    stock: 15,
    isFeatured: true,
  },
  {
    name: 'Giỏ Quà Tết Vàng Phát Tài',
    slug: 'gio-qua-tet-vang-phat-tai',
    description: 'Giỏ quà Tết tông vàng rực rỡ với bánh Custas, trà đào, snack nhập khẩu. Tươi sáng và may mắn đón xuân.',
    price: 1200000,
    images: ['/uploads/593602020_1534065894892384_3856845494222715678_n.jpg'],
    category: 'gio-qua-tet',
    stock: 20,
  },
  {
    name: 'Giỏ Quà Tết Hồng Phúc',
    slug: 'gio-qua-tet-hong-phuc',
    description: 'Giỏ quà Tết đỏ vàng rực rỡ với bánh LU, Ferrero Rocher, quạt giấy, mèo thần tài. Đậm đà hương vị Tết cổ truyền.',
    price: 1600000,
    images: ['/uploads/595600038_1534065814892392_3038998564339100036_n.jpg'],
    category: 'gio-qua-tet',
    stock: 18,
  },
  {
    name: 'Giỏ Quà Tết Xanh Dương Premium',
    slug: 'gio-qua-tet-xanh-duong-premium',
    description: 'Giỏ quà Tết xanh dương cao cấp với rượu vang, yến sào, cafe hảo hạng. Sang trọng và đẳng cấp.',
    price: 2000000,
    images: ['/uploads/594964224_1534065944892379_6440578156398239641_n.jpg'],
    category: 'gio-qua-tet',
    stock: 10,
  },
  {
    name: 'Giỏ Quà Tết Biển Xanh',
    slug: 'gio-qua-tet-bien-xanh',
    description: 'Giỏ quà Tết tông xanh biển tươi mát với rượu vang 1989, Ferrero Rocher, cafe nhập khẩu. Hiện đại và tinh tế.',
    price: 1700000,
    images: ['/uploads/595551826_1534065634892410_259029151425246890_n.jpg'],
    category: 'gio-qua-tet',
    stock: 15,
  },

  // Giỏ Trái Cây
  {
    name: 'Giỏ Trái Cây Khai Trương',
    slug: 'gio-trai-cay-khai-truong',
    description: 'Giỏ trái cây tươi ngon với cam, nho, táo nhập khẩu, trang trí nơ vàng sang trọng. Chúc mừng khai trương, tân gia thịnh vượng.',
    price: 800000,
    images: ['/uploads/591911033_1529664178665889_1751146594778392361_n.jpg'],
    category: 'gio-trai-cay',
    stock: 25,
  },
  {
    name: 'Giỏ Trái Cây Hoa Hồng',
    slug: 'gio-trai-cay-hoa-hong',
    description: 'Giỏ trái cây tươi kết hợp hoa hồng cam rực rỡ, cúc trắng tinh khôi. Thích hợp thăm hỏi, chúc mừng sinh nhật.',
    price: 1000000,
    images: ['/uploads/596785703_1535219624777011_1657063163776478543_n.jpg'],
    category: 'gio-trai-cay',
    stock: 20,
  },
  {
    name: 'Tháp Trái Cây Hoa Tươi',
    slug: 'thap-trai-cay-hoa-tuoi',
    description: 'Tháp trái cây cao cấp với nho đỏ, cam vàng, táo xanh đỏ, trang trí hoa hồng trắng. Ấn tượng và sang trọng.',
    price: 1500000,
    images: ['/uploads/597323554_1538325517799755_8209913830030218240_n.jpg'],
    category: 'gio-trai-cay',
    stock: 15,
    isFeatured: true,
  },

  // Hoa Cưới
  {
    name: 'Hoa Cưới Lan Hồ Điệp',
    slug: 'hoa-cuoi-lan-ho-diep',
    description: 'Bó hoa cầm tay cô dâu với lan hồ điệp trắng tinh khôi, calla lily thanh lịch. Vẻ đẹp thuần khiết cho ngày trọng đại.',
    price: 600000,
    images: ['/uploads/595151883_1536096181356022_3910860693793482297_n.jpg'],
    category: 'hoa-cuoi',
    stock: 20,
    isFeatured: true,
  },

  // Quà Tặng
  {
    name: 'Giỏ Quà Bánh Kẹo Tết',
    slug: 'gio-qua-banh-keo-tet',
    description: 'Giỏ bánh kẹo nhập khẩu cao cấp với nơ đỏ trang trí sang trọng. Phù hợp biếu tặng đối tác, người thân dịp lễ Tết.',
    price: 900000,
    images: ['/uploads/591936444_1534065538225753_1260015567398249966_n.jpg'],
    category: 'qua-tang',
    stock: 25,
  },
  {
    name: 'Giỏ Quà Yến Sào Hoa Hồng',
    slug: 'gio-qua-yen-sao-hoa-hong',
    description: 'Giỏ yến sào cao cấp trang trí hoa hồng kem nhẹ nhàng, cúc xanh tươi mát. Quà tặng ý nghĩa cho sức khỏe người thân.',
    price: 1300000,
    images: ['/uploads/595155000_1538325424466431_8982145334792521892_n.jpg'],
    category: 'qua-tang',
    stock: 15,
    isFeatured: true,
  },
];

async function seedDatabase() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối MongoDB');

    // Xóa dữ liệu cũ
    console.log('🗑️  Đang xóa dữ liệu cũ...');
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Tạo danh mục
    console.log('📁 Đang tạo danh mục...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Đã tạo ${createdCategories.length} danh mục`);

    // Map slug -> _id
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    // Cập nhật category ID cho sản phẩm
    const productsWithCategory = products.map(product => ({
      ...product,
      category: categoryMap[product.category],
    }));

    // Tạo sản phẩm
    console.log('🌸 Đang tạo sản phẩm...');
    const createdProducts = await Product.insertMany(productsWithCategory);
    console.log(`✅ Đã tạo ${createdProducts.length} sản phẩm`);

    console.log('\n🎉 Hoàn tất! Dữ liệu đã được thêm vào database.');
    console.log('\n📊 Tóm tắt:');
    console.log(`   - Danh mục: ${createdCategories.length}`);
    console.log(`   - Sản phẩm: ${createdProducts.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

seedDatabase();
