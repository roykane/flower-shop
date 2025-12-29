const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Category = require('../models/Category');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flower-shop';

// Sản phẩm mới với hình ảnh chưa sử dụng
const newProducts = [
  // ===== MÂM QUẢ CƯỚI =====
  {
    name: 'Mâm Quả Cưới Hồng Phấn',
    description: 'Bộ mâm quả cưới tông hồng phấn dịu dàng với hoa hồng, đào tiên, bánh kẹo cao cấp. Phong cách nhẹ nhàng, lãng mạn cho cô dâu hiện đại.',
    price: 3200000,
    images: ['/uploads/541703309_1443632970602344_717766491493782017_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 8,
    isFeatured: true,
  },
  {
    name: 'Tráp Quả Đào Tiên',
    description: 'Tráp đào tiên tươi với hoa hồng đỏ rực rỡ, biểu tượng của sự trường thọ và hạnh phúc viên mãn.',
    price: 950000,
    images: ['/uploads/541781256_1448521966780111_7693291922543164741_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 15,
  },
  {
    name: 'Tráp Trái Cây Cưới Sang Trọng',
    description: 'Tráp trái cây nhập khẩu với nho xanh, cam, táo, trang trí hoa hồng kem. Tươi ngon và đẹp mắt.',
    price: 1100000,
    images: ['/uploads/542176223_1448522150113426_8601746506084542587_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 12,
  },
  {
    name: 'Mâm Quả 7 Tráp Đỏ Vàng',
    description: 'Bộ 7 tráp đầy đủ tông đỏ vàng truyền thống: trầu cau, trái cây, bánh kem, rượu, yến, bánh kẹo, hạt. Hoàn hảo cho lễ ăn hỏi.',
    price: 5500000,
    images: ['/uploads/544739828_1448521923446782_2542742596705698559_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 5,
    isFeatured: true,
  },
  {
    name: 'Tráp Cau Lá Trầu Hoa Hồng',
    description: 'Tráp cau lá trầu truyền thống trang trí hoa hồng đỏ thắm, quạt giấy. Ý nghĩa thiêng liêng cho lễ dạm ngõ.',
    price: 850000,
    images: ['/uploads/550205684_1464102555222052_713091098034298711_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 20,
  },
  {
    name: 'Tráp Hạt Dinh Dưỡng Hoa Tươi',
    description: 'Tráp hạt điều, hạnh nhân, óc chó cao cấp trang trí hoa cúc vàng rực rỡ. Ý nghĩa sức khỏe và thịnh vượng.',
    price: 1300000,
    images: ['/uploads/550452481_1465247158440925_7421006913136331217_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 10,
  },
  {
    name: 'Tráp Bánh Pía Hoa Lan',
    description: 'Tráp bánh pía Sóc Trăng trang trí hoa lan trắng thanh lịch. Hương vị truyền thống, sang trọng.',
    price: 900000,
    images: ['/uploads/552944322_1465247211774253_2203663870097051403_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 15,
  },
  {
    name: 'Mâm Quả Cưới Đỏ Truyền Thống',
    description: 'Bộ mâm quả tông đỏ truyền thống với quạt giấy, hoa hồng đỏ, trái cây tươi. Đậm nét văn hóa Việt.',
    price: 2900000,
    images: ['/uploads/555602985_1470021794630128_144387199201939727_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 8,
  },
  {
    name: 'Tráp Rượu Vang Hoa Hồng Kem',
    description: 'Tráp rượu vang đỏ cao cấp trang trí hoa hồng kem, baby breath. Sang trọng cho lễ ăn hỏi.',
    price: 1400000,
    images: ['/uploads/555939124_1470021737963467_4539579315506515149_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 12,
  },
  {
    name: 'Tráp Socola Ferrero Rocher',
    description: 'Tráp socola Ferrero Rocher cao cấp với hoa hồng đỏ và lá xanh. Ngọt ngào như tình yêu.',
    price: 1200000,
    images: ['/uploads/556039770_1471854437780197_4495951348044844684_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 15,
  },
  {
    name: 'Tráp Bánh Custas Hoa Tươi',
    description: 'Tráp bánh Custas nhập khẩu Hàn Quốc trang trí hoa hồng kem và cúc xanh. Hiện đại và tinh tế.',
    price: 1000000,
    images: ['/uploads/556110410_1471854507780190_2630854857172059235_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 18,
  },
  {
    name: 'Mâm Quả 5 Tráp Hồng Đỏ',
    description: 'Bộ 5 tráp tông hồng đỏ rực rỡ với hoa hồng, quạt giấy, ruy băng. Đẹp và đầy đủ.',
    price: 4200000,
    images: ['/uploads/557588152_1476197400679234_7799483236676718564_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 6,
    isFeatured: true,
  },
  {
    name: 'Tráp Trà Bánh Hoa Cúc',
    description: 'Tráp trà Ô Long cao cấp kết hợp bánh quy, trang trí hoa cúc vàng. Thanh nhã và ý nghĩa.',
    price: 950000,
    images: ['/uploads/557589621_1471854634446844_7297468980356137961_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 14,
  },
  {
    name: 'Tráp Mứt Hạt Hoa Hồng',
    description: 'Tráp mứt dừa, hạt sen, kẹo gừng với hoa hồng đỏ. Hương vị Tết truyền thống cho lễ cưới.',
    price: 800000,
    images: ['/uploads/557596601_1471854361113538_6348888957440348922_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 20,
  },
  {
    name: 'Tráp Yến Sào Đỏ Sang Trọng',
    description: 'Tráp yến sào nguyên chất trang trí hoa hồng đỏ thắm và lá xanh. Quý phái và đẳng cấp.',
    price: 2800000,
    images: ['/uploads/557605431_1478135233818784_1341623777674993826_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 6,
  },
  {
    name: 'Mâm Quả Cưới Tông Cam',
    description: 'Bộ mâm quả tông cam rực rỡ với hoa hồng cam, cúc vàng. Tươi sáng và vui tươi.',
    price: 3100000,
    images: ['/uploads/557619790_1476197440679230_8804281485544803161_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 7,
  },
  {
    name: 'Tráp Bánh Trung Thu Hoa Lan',
    description: 'Tráp bánh trung thu cao cấp trang trí hoa lan trắng. Phù hợp lễ cưới mùa thu.',
    price: 1100000,
    images: ['/uploads/557622213_1476197367345904_4968147972822363238_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 10,
  },
  {
    name: 'Tráp Kẹo Hạt Hoa Cúc Vàng',
    description: 'Tráp kẹo sữa, hạt điều rang muối trang trí hoa cúc vàng rực rỡ. Ngọt ngào và may mắn.',
    price: 750000,
    images: ['/uploads/557629742_1471854721113502_2710668016265258457_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 25,
  },
  {
    name: 'Mâm Quả 6 Tráp Truyền Thống',
    description: 'Bộ 6 tráp đầy đủ với hoa hồng đỏ, quạt giấy, ruy băng vàng. Trọn vẹn cho lễ ăn hỏi.',
    price: 4800000,
    images: ['/uploads/557633977_1476197490679225_513841277764041860_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 5,
    isFeatured: true,
  },
  {
    name: 'Tráp Nước Yến Hoa Hồng Trắng',
    description: 'Tráp nước yến Bird nest cao cấp trang trí hoa hồng trắng tinh khôi. Thanh lịch và quý phái.',
    price: 1600000,
    images: ['/uploads/557634948_1476197244012583_5341320824011568356_n.jpg'],
    categorySlug: 'mam-qua-cuoi',
    stock: 10,
  },

  // ===== GIỎ QUÀ TẾT =====
  {
    name: 'Giỏ Quà Tết Sen Hồng',
    description: 'Giỏ quà Tết với hạt sen, bánh kẹo, hoa sen hồng trang trí. Thanh nhã và ý nghĩa.',
    price: 1400000,
    images: ['/uploads/561612516_1489636136002027_7119799747542459277_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 15,
  },
  {
    name: 'Giỏ Quà Tết Rượu Vang Đỏ',
    description: 'Giỏ quà sang trọng với rượu vang đỏ nhập khẩu, chocolate, hoa hồng đỏ. Đẳng cấp doanh nhân.',
    price: 2200000,
    images: ['/uploads/565134899_1491327082499599_9208041130552965083_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 12,
    isFeatured: true,
  },
  {
    name: 'Giỏ Quà Tết Xanh Lá',
    description: 'Giỏ quà Tết tông xanh lá tươi mát với bánh kẹo, trà, mứt. Phong cách độc đáo.',
    price: 1300000,
    images: ['/uploads/565215782_1491327365832904_2526518746414819336_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 18,
  },
  {
    name: 'Giỏ Quà Tết Hoa Đào',
    description: 'Giỏ quà Tết với cành đào hồng, bánh kẹo, rượu vang. Đậm hương xuân miền Bắc.',
    price: 1900000,
    images: ['/uploads/571346092_1503823294583311_150108988820495414_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 10,
    isFeatured: true,
  },
  {
    name: 'Giỏ Quà Tết Vàng Óng',
    description: 'Giỏ quà Tết tông vàng sang trọng với bánh nhập khẩu, mèo thần tài, hoa cúc. Phú quý cả năm.',
    price: 1600000,
    images: ['/uploads/573353490_1503823354583305_6300703159443332208_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 15,
  },
  {
    name: 'Giỏ Quà Tết Đỏ May Mắn',
    description: 'Giỏ quà Tết đỏ rực với Ferrero Rocher, bánh LU, mèo vàng may mắn. Đón xuân tài lộc.',
    price: 1500000,
    images: ['/uploads/573558265_1505931747705799_6694391209471048504_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 20,
  },
  {
    name: 'Giỏ Quà Tết Hồng Phấn',
    description: 'Giỏ quà Tết tông hồng phấn dịu dàng với bánh kẹo, hoa hồng. Nhẹ nhàng nữ tính.',
    price: 1250000,
    images: ['/uploads/577010021_1513195680312739_5262725022844784668_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 18,
  },
  {
    name: 'Giỏ Quà Tết Xanh Ngọc',
    description: 'Giỏ quà Tết xanh ngọc sang trọng với rượu vang, chocolate, hoa lan. Đẳng cấp và tinh tế.',
    price: 2000000,
    images: ['/uploads/579600681_1513195743646066_7812865485554022215_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 10,
  },
  {
    name: 'Giỏ Quà Tết Cam Vàng',
    description: 'Giỏ quà Tết tông cam vàng rực rỡ với bánh kẹo nhập khẩu, hoa cúc. Tươi sáng đón xuân.',
    price: 1350000,
    images: ['/uploads/581068967_1513195793646061_4549014658772943663_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 16,
  },
  {
    name: 'Giỏ Quà Tết Tím Sang Trọng',
    description: 'Giỏ quà Tết tông tím đặc biệt với rượu vang, socola, hoa lan tím. Khác biệt và ấn tượng.',
    price: 1800000,
    images: ['/uploads/582217925_1513195863646054_3884211807834085273_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 12,
  },
  {
    name: 'Giỏ Quà Tết Mini Xinh Xắn',
    description: 'Giỏ quà Tết nhỏ xinh với bánh kẹo, hoa tươi. Phù hợp tặng bạn bè, đồng nghiệp.',
    price: 650000,
    images: ['/uploads/583183427_1518762363089404_5803342512176862925_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 30,
  },
  {
    name: 'Giỏ Quà Tết Cafe Hảo Hạng',
    description: 'Giỏ quà Tết với cafe hạt rang xay, bánh quy, chocolate. Thích hợp cho người sành cafe.',
    price: 1100000,
    images: ['/uploads/583319462_1520405299591777_8455947471639717969_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 20,
  },
  {
    name: 'Giỏ Quà Tết Đỏ Vàng Truyền Thống',
    description: 'Giỏ quà Tết đỏ vàng truyền thống với mèo thần tài, bánh kẹo, rượu. Đậm chất Tết Việt.',
    price: 1700000,
    images: ['/uploads/583333748_1519438639688443_1509463790152103264_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 14,
  },
  {
    name: 'Giỏ Quà Tết Hoa Hồng Đỏ',
    description: 'Giỏ quà Tết với hoa hồng đỏ tươi, bánh kẹo nhập khẩu, rượu vang. Lãng mạn và sang trọng.',
    price: 1850000,
    images: ['/uploads/583900873_1518763493089291_1231441185020157523_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 12,
  },
  {
    name: 'Giỏ Quà Tết Xanh Biển Nhạt',
    description: 'Giỏ quà Tết xanh biển nhẹ nhàng với bánh kẹo, trà, hoa. Thanh thoát và tinh tế.',
    price: 1200000,
    images: ['/uploads/583927951_1518763459755961_5759739343228904054_n.jpg'],
    categorySlug: 'gio-qua-tet',
    stock: 18,
  },

  // ===== GIỎ TRÁI CÂY =====
  {
    name: 'Giỏ Trái Cây Hoa Lan Vàng',
    description: 'Giỏ trái cây tươi với lan vũ nữ vàng rực rỡ. Sang trọng cho khai trương, chúc mừng.',
    price: 1200000,
    images: ['/uploads/584580946_1519438709688436_8947896888464661624_n.jpg'],
    categorySlug: 'gio-trai-cay',
    stock: 15,
    isFeatured: true,
  },
  {
    name: 'Giỏ Trái Cây Nhập Khẩu Premium',
    description: 'Giỏ trái cây nhập khẩu cao cấp: nho Mỹ, táo Envy, cam Úc, kiwi. Tươi ngon số 1.',
    price: 1800000,
    images: ['/uploads/584790380_1518762409756066_3832979926012537049_n.jpg'],
    categorySlug: 'gio-trai-cay',
    stock: 10,
    isFeatured: true,
  },
  {
    name: 'Giỏ Trái Cây Mini Xinh',
    description: 'Giỏ trái cây nhỏ xinh với táo, cam, nho. Phù hợp thăm hỏi, tặng bạn bè.',
    price: 500000,
    images: ['/uploads/585251531_1520405422925098_8298492538091852348_n.jpg'],
    categorySlug: 'gio-trai-cay',
    stock: 30,
  },
  {
    name: 'Giỏ Trái Cây Hoa Cúc Vàng',
    description: 'Giỏ trái cây tươi trang trí hoa cúc vàng rực rỡ. Tươi sáng và may mắn.',
    price: 900000,
    images: ['/uploads/585883750_1523605395938434_3980393493864548669_n.jpg'],
    categorySlug: 'gio-trai-cay',
    stock: 20,
  },
  {
    name: 'Giỏ Trái Cây Hoa Hồng Phấn',
    description: 'Giỏ trái cây tươi với hoa hồng phấn nhẹ nhàng. Thích hợp thăm bệnh, chúc mừng.',
    price: 1100000,
    images: ['/uploads/585884250_1519438746355099_4322062920526688294_n.jpg'],
    categorySlug: 'gio-trai-cay',
    stock: 18,
  },
  {
    name: 'Tháp Trái Cây 3 Tầng',
    description: 'Tháp trái cây 3 tầng hoành tráng với nho, cam, táo, kiwi. Ấn tượng cho sự kiện lớn.',
    price: 2500000,
    images: ['/uploads/585890432_1523605329271774_8354429901321963440_n.jpg'],
    categorySlug: 'gio-trai-cay',
    stock: 5,
    isFeatured: true,
  },
  {
    name: 'Giỏ Trái Cây Hoa Đồng Tiền',
    description: 'Giỏ trái cây tươi trang trí hoa đồng tiền cam. Mang lại tài lộc và may mắn.',
    price: 950000,
    images: ['/uploads/585890624_1523638709268436_2721450726066223664_n.jpg'],
    categorySlug: 'gio-trai-cay',
    stock: 22,
  },
  {
    name: 'Giỏ Trái Cây Đỏ Cam',
    description: 'Giỏ trái cây với cam, táo đỏ, cherry trang trí hoa hồng đỏ. Rực rỡ và tươi tắn.',
    price: 1300000,
    images: ['/uploads/585891142_1523639025935071_9138255653069144333_n.jpg'],
    categorySlug: 'gio-trai-cay',
    stock: 15,
  },
  {
    name: 'Giỏ Trái Cây Nho Xanh',
    description: 'Giỏ trái cây với nho xanh Mỹ, táo xanh, lê. Tươi mát và thanh khiết.',
    price: 1150000,
    images: ['/uploads/585892055_1523639062601734_8198241269740368806_n.jpg'],
    categorySlug: 'gio-trai-cay',
    stock: 18,
  },
  {
    name: 'Giỏ Trái Cây Hoa Lan Trắng',
    description: 'Giỏ trái cây cao cấp trang trí hoa lan trắng thanh lịch. Sang trọng và tinh tế.',
    price: 1400000,
    images: ['/uploads/585898351_1523638919268415_2639661856954712191_n.jpg'],
    categorySlug: 'gio-trai-cay',
    stock: 12,
  },
  {
    name: 'Giỏ Trái Cây Hoa Baby',
    description: 'Giỏ trái cây tươi trang trí baby breath trắng. Nhẹ nhàng và tinh khôi.',
    price: 850000,
    images: ['/uploads/586039185_1523605472605093_3346212152869480946_n.jpg'],
    categorySlug: 'gio-trai-cay',
    stock: 25,
  },
  {
    name: 'Giỏ Trái Cây Tròn Xinh',
    description: 'Giỏ trái cây tròn xinh xắn với táo, cam, nho. Gọn gàng và dễ thương.',
    price: 750000,
    images: ['/uploads/586631851_1523604775938496_55152807813925665_n.jpg'],
    categorySlug: 'gio-trai-cay',
    stock: 28,
  },
  {
    name: 'Giỏ Trái Cây Hoa Hướng Dương',
    description: 'Giỏ trái cây tươi với hoa hướng dương vàng rực. Tươi sáng như ánh mặt trời.',
    price: 1000000,
    images: ['/uploads/587032152_1525782499054057_6987612127900338660_n.jpg'],
    categorySlug: 'gio-trai-cay',
    stock: 18,
  },
  {
    name: 'Giỏ Trái Cây Hoa Cẩm Tú Cầu',
    description: 'Giỏ trái cây cao cấp trang trí hoa cẩm tú cầu xanh. Độc đáo và sang trọng.',
    price: 1350000,
    images: ['/uploads/587042783_1523638865935087_982404140985604661_n.jpg'],
    categorySlug: 'gio-trai-cay',
    stock: 10,
  },

  // ===== HOA CƯỚI =====
  {
    name: 'Hoa Cầm Tay Hồng Pastel',
    description: 'Bó hoa cầm tay cô dâu với hồng pastel, cẩm chướng, baby breath. Nhẹ nhàng và lãng mạn.',
    price: 550000,
    images: ['/uploads/587092596_1525782479054059_8660623576063782266_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 20,
  },
  {
    name: 'Hoa Cưới Hồng Đỏ Cổ Điển',
    description: 'Bó hoa cưới hồng đỏ cổ điển với lá xanh, baby breath. Đẹp vượt thời gian.',
    price: 650000,
    images: ['/uploads/587221702_1523638989268408_9123731857724791367_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 18,
    isFeatured: true,
  },
  {
    name: 'Hoa Cầm Tay Hồng Kem',
    description: 'Bó hoa cầm tay hồng kem thanh lịch với cẩm chướng trắng. Tinh tế và sang trọng.',
    price: 500000,
    images: ['/uploads/588545286_1525782702387370_391413519966241677_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 22,
  },
  {
    name: 'Hoa Cưới Hồng Tím Sen',
    description: 'Bó hoa cưới hồng tím sen lãng mạn với hoa bi, cát tường. Độc đáo và ấn tượng.',
    price: 700000,
    images: ['/uploads/588616368_1523604812605159_6857107058695014159_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 15,
  },
  {
    name: 'Hoa Cầm Tay Lan Trắng',
    description: 'Bó hoa cầm tay lan trắng tinh khôi, thanh lịch. Vẻ đẹp thuần khiết cho cô dâu.',
    price: 750000,
    images: ['/uploads/588953441_1525782535720720_5616173906134187652_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 15,
    isFeatured: true,
  },
  {
    name: 'Hoa Cưới Hồng Đào',
    description: 'Bó hoa cưới hồng đào dịu dàng với baby breath trắng. Nữ tính và lãng mạn.',
    price: 580000,
    images: ['/uploads/588960815_1527536732211967_2344426584382867669_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 20,
  },
  {
    name: 'Hoa Cầm Tay Cát Tường',
    description: 'Bó hoa cầm tay cát tường hồng, trắng, tím. Đẹp và ý nghĩa tốt lành.',
    price: 480000,
    images: ['/uploads/589007206_1527539028878404_1177154374750964682_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 25,
  },
  {
    name: 'Hoa Cưới Hồng Cam Rực Rỡ',
    description: 'Bó hoa cưới hồng cam rực rỡ với lá xanh tươi. Tươi sáng và vui tươi.',
    price: 620000,
    images: ['/uploads/589009223_1525662142399426_2611379896388152967_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 18,
  },
  {
    name: 'Hoa Cầm Tay Sen Đá',
    description: 'Bó hoa cầm tay với sen đá, hồng, baby breath. Độc đáo phong cách rustic.',
    price: 700000,
    images: ['/uploads/589250010_1527538018878505_4526671413362044532_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 12,
  },
  {
    name: 'Hoa Cưới Trắng Tinh Khôi',
    description: 'Bó hoa cưới trắng tinh khôi với hồng trắng, lan, cẩm tú cầu. Thanh lịch tuyệt đối.',
    price: 800000,
    images: ['/uploads/589550243_1527537022211938_8290678143923756958_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 15,
    isFeatured: true,
  },
  {
    name: 'Hoa Cầm Tay Tím Lavender',
    description: 'Bó hoa cầm tay tím lavender lãng mạn với cát tường. Mộng mơ và thanh tao.',
    price: 550000,
    images: ['/uploads/589610527_1525782592387381_3867519009652576508_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 18,
  },
  {
    name: 'Hoa Cưới Hồng Phấn Baby',
    description: 'Bó hoa cưới hồng phấn với baby breath trắng. Nhẹ nhàng như áng mây.',
    price: 520000,
    images: ['/uploads/589732576_1527539215545052_1464766892496285428_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 22,
  },
  {
    name: 'Hoa Cầm Tay Calla Lily',
    description: 'Bó hoa cầm tay calla lily trắng thanh lịch. Vẻ đẹp hiện đại và tinh tế.',
    price: 680000,
    images: ['/uploads/589736331_1527536848878622_150036282381607680_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 15,
  },
  {
    name: 'Hoa Cưới Hồng Đỏ Thắm',
    description: 'Bó hoa cưới hồng đỏ thắm với lá xanh đậm. Đam mê và nồng cháy.',
    price: 600000,
    images: ['/uploads/589808679_1527537152211925_5329001558883181287_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 20,
  },
  {
    name: 'Hoa Cầm Tay Mini Xinh',
    description: 'Bó hoa cầm tay mini xinh xắn với hồng, cẩm chướng. Gọn gàng và dễ thương.',
    price: 400000,
    images: ['/uploads/589823813_1527536872211953_2727485814938597092_n.jpg'],
    categorySlug: 'hoa-cuoi',
    stock: 30,
  },

  // ===== QUÀ TẶNG =====
  {
    name: 'Giỏ Quà Rượu Vang Cao Cấp',
    description: 'Giỏ quà với rượu vang đỏ cao cấp, chocolate, hoa hồng. Đẳng cấp cho đối tác.',
    price: 2500000,
    images: ['/uploads/590210091_1525782642387376_5667392483889383455_n.jpg'],
    categorySlug: 'qua-tang',
    stock: 10,
    isFeatured: true,
  },
  {
    name: 'Giỏ Quà Sinh Nhật Hồng',
    description: 'Giỏ quà sinh nhật tông hồng với bánh kẹo, hoa hồng. Ngọt ngào cho người thương.',
    price: 800000,
    images: ['/uploads/591025610_1527539292211711_8067780160844567623_n.jpg'],
    categorySlug: 'qua-tang',
    stock: 20,
  },
  {
    name: 'Giỏ Quà 8/3 Hoa Hồng',
    description: 'Giỏ quà ngày phụ nữ với hoa hồng đỏ, chocolate, bánh. Yêu thương gửi trao.',
    price: 950000,
    images: ['/uploads/591264714_1527539372211703_7001342989063866473_n.jpg'],
    categorySlug: 'qua-tang',
    stock: 25,
  },
  {
    name: 'Giỏ Quà Khai Trương',
    description: 'Giỏ quà khai trương với trái cây, bánh, hoa tươi. Chúc thịnh vượng phát tài.',
    price: 1200000,
    images: ['/uploads/591507334_1527538618878445_8277644600208471110_n.jpg'],
    categorySlug: 'qua-tang',
    stock: 15,
  },
];

// Hàm tạo slug từ tên
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Xóa dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function addProducts() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối MongoDB');

    // Lấy danh mục hiện tại
    console.log('📁 Đang lấy danh mục...');
    const categories = await Category.find();

    if (categories.length === 0) {
      console.error('❌ Không tìm thấy danh mục. Vui lòng chạy seedProducts.js trước.');
      process.exit(1);
    }

    // Map slug -> _id
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    console.log('📊 Danh mục hiện tại:');
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });

    // Cập nhật category ID cho sản phẩm mới
    const productsWithCategory = newProducts.map(product => ({
      name: product.name,
      slug: generateSlug(product.name),
      description: product.description,
      price: product.price,
      images: product.images,
      category: categoryMap[product.categorySlug],
      stock: product.stock,
      featured: product.isFeatured || false,
    }));

    // Kiểm tra sản phẩm đã tồn tại
    const existingProducts = await Product.find({}, 'name');
    const existingNames = new Set(existingProducts.map(p => p.name));

    const newProductsToAdd = productsWithCategory.filter(p => !existingNames.has(p.name));

    if (newProductsToAdd.length === 0) {
      console.log('ℹ️  Tất cả sản phẩm đã tồn tại trong database.');
      process.exit(0);
    }

    // Thêm sản phẩm mới
    console.log(`🌸 Đang thêm ${newProductsToAdd.length} sản phẩm mới...`);
    const createdProducts = await Product.insertMany(newProductsToAdd);
    console.log(`✅ Đã thêm ${createdProducts.length} sản phẩm mới`);

    // Thống kê theo danh mục
    const stats = {};
    createdProducts.forEach(p => {
      const cat = categories.find(c => c._id.toString() === p.category.toString());
      if (cat) {
        stats[cat.name] = (stats[cat.name] || 0) + 1;
      }
    });

    console.log('\n🎉 Hoàn tất! Thống kê sản phẩm mới theo danh mục:');
    Object.entries(stats).forEach(([name, count]) => {
      console.log(`   - ${name}: ${count} sản phẩm`);
    });

    // Tổng sản phẩm
    const totalProducts = await Product.countDocuments();
    console.log(`\n📊 Tổng số sản phẩm trong database: ${totalProducts}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

addProducts();
