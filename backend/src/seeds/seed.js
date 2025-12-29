const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flower-shop';

const categories = [
  {
    name: 'Bó Hoa',
    description: 'Bó hoa tươi đẹp cho mọi dịp',
    image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800',
  },
  {
    name: 'Giỏ Hoa',
    description: 'Giỏ hoa thanh lịch hoàn hảo để tặng',
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800',
  },
  {
    name: 'Hoa Cưới',
    description: 'Làm ngày trọng đại của bạn thêm khó quên với hoa cưới',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
  },
  {
    name: 'Hoa Khai Trương',
    description: 'Kệ hoa khai trương chúc mừng khởi đầu mới',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  },
];

const products = [
  {
    name: 'Bó Hồng Đỏ Cổ Điển',
    description: 'Một sản phẩm cổ điển vượt thời gian bao gồm 12 bông hồng thân dài cao cấp, được tuyển chọn kỹ lưỡng vì vẻ đẹp và độ tươi. Hoàn hảo để thể hiện tình yêu và sự lãng mạn.',
    price: 450000,
    images: [
      'https://images.unsplash.com/photo-1518882605630-8eb738f13eb6?w=800',
      'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=800',
    ],
    categoryName: 'Bó Hoa',
    stock: 25,
    featured: true,
    tags: ['hoa-hong', 'lang-man', 'ban-chay'],
  },
  {
    name: 'Hoa Tulip Mùa Xuân',
    description: 'Hoa tulip tươi mới và rực rỡ với nhiều màu sắc. Mang niềm vui của mùa xuân đến mọi không gian.',
    price: 380000,
    images: ['https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800'],
    categoryName: 'Bó Hoa',
    stock: 30,
    featured: true,
    tags: ['tulip', 'mua-xuan', 'sac-mau'],
  },
  {
    name: 'Gió Mùa Hè',
    description: 'Sự kết hợp tươi mới của các loại hoa mùa hè bao gồm hoa hướng dương, cúc họa mi và cúc.',
    price: 550000,
    images: ['https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800'],
    categoryName: 'Bó Hoa',
    stock: 20,
    featured: true,
    tags: ['mua-he', 'ket-hop', 'tuoi-vui'],
  },
  {
    name: 'Thanh Lịch Thuần Khiết',
    description: 'Bố cục thanh lịch với hoa hồng trắng và hoa ly, hoàn hảo cho đám cưới và dịp trang trọng.',
    price: 620000,
    images: ['https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=800'],
    categoryName: 'Hoa Cưới',
    stock: 15,
    featured: true,
    tags: ['trang', 'thanh-lich', 'dam-cuoi'],
  },
  {
    name: 'Hồng Lãng Mạn',
    description: 'Hoa hồng hồng nhẹ nhàng và mẫu đơn tạo nên sự sắp xếp lãng mạn và nữ tính.',
    price: 480000,
    images: ['https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800'],
    categoryName: 'Bó Hoa',
    stock: 18,
    tags: ['hong', 'lang-man', 'mau-don'],
  },
  {
    name: 'Giỏ Hoa Ánh Dương',
    description: 'Hoa hướng dương tươi sáng và hoa hồng vàng được sắp xếp trong một giỏ đan đẹp mắt.',
    price: 720000,
    images: ['https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800'],
    categoryName: 'Giỏ Hoa',
    stock: 12,
    tags: ['huong-duong', 'vang', 'gio'],
  },
  {
    name: 'Giấc Mơ Lavender',
    description: 'Hoa lavender thơm ngát và hoa tím tạo nên vẻ đẹp yên bình và thư giãn.',
    price: 520000,
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
    categoryName: 'Bó Hoa',
    stock: 22,
    tags: ['lavender', 'tim', 'thom-ngat'],
  },
  {
    name: 'Hạnh Phúc Cưới',
    description: 'Bộ hoa cô dâu hoàn chỉnh với hoa phụ dâu đi kèm trong tông trắng thanh lịch và hồng nhẹ.',
    price: 1200000,
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=800'],
    categoryName: 'Hoa Cưới',
    stock: 10,
    featured: true,
    tags: ['co-dau', 'dam-cuoi', 'trang', 'hong'],
  },
  {
    name: 'Kệ Hoa Khai Trương',
    description: 'Kệ hoa ấn tượng hoàn hảo cho khai trương, với hoa đỏ và vàng mang lại may mắn.',
    price: 1500000,
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
    categoryName: 'Hoa Khai Trương',
    stock: 8,
    tags: ['khai-truong', 'chuc-mung', 'ke-hoa'],
  },
  {
    name: 'Giỏ Hoa Vườn Nhà',
    description: 'Sự kết hợp thú vị của các loại hoa vườn được sắp xếp trong giỏ mộc mạc.',
    price: 650000,
    images: ['https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800'],
    categoryName: 'Giỏ Hoa',
    stock: 14,
    tags: ['vuon', 'ket-hop', 'moc-mac'],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Đã kết nối MongoDB');

    // Xóa dữ liệu cũ
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Đã xóa dữ liệu cũ');

    // Tạo tài khoản admin
    const admin = await User.create({
      name: 'Quản Trị Viên',
      email: 'admin@hoatuoidep.vn',
      password: 'admin123',
      role: 'admin',
    });
    console.log('Đã tạo tài khoản admin:', admin.email);

    // Tạo tài khoản người dùng test
    const user = await User.create({
      name: 'Người Dùng Test',
      email: 'user@example.com',
      password: 'user123',
      role: 'user',
    });
    console.log('Đã tạo tài khoản người dùng:', user.email);

    // Tạo danh mục
    const createdCategories = await Category.create(categories);
    console.log(`Đã tạo ${createdCategories.length} danh mục`);

    // Tạo map danh mục
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // Tạo sản phẩm
    const productsWithCategories = products.map(product => ({
      ...product,
      category: categoryMap[product.categoryName],
    }));

    const createdProducts = await Product.create(productsWithCategories);
    console.log(`Đã tạo ${createdProducts.length} sản phẩm`);

    console.log('\n--- Seed hoàn tất! ---');
    console.log('\nTài khoản test:');
    console.log('Admin: admin@hoatuoidep.vn / admin123');
    console.log('Người dùng: user@example.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed:', error);
    process.exit(1);
  }
}

seed();
