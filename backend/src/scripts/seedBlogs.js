const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Blog = require('../models/Blog');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flower-shop';

const blogs = [
  {
    title: 'Hoa Sinh Nhật - Món Quà Ý Nghĩa Cho Ngày Đặc Biệt',
    slug: 'hoa-sinh-nhat-mon-qua-y-nghia',
    excerpt: 'Khám phá bí quyết chọn hoa sinh nhật phù hợp với từng độ tuổi, giới tính và mối quan hệ. Mỗi bông hoa đều mang thông điệp yêu thương riêng.',
    content: `
      <h2>Hoa Sinh Nhật - Gửi Gắm Yêu Thương Trong Từng Cánh Hoa</h2>

      <p>Sinh nhật là dịp đặc biệt để bạn thể hiện tình cảm với những người thân yêu. Và còn gì tuyệt vời hơn một bó hoa tươi thắm, mang theo lời chúc phúc và niềm vui đến với họ?</p>

      <h3>Gợi Ý Hoa Theo Độ Tuổi</h3>

      <h4>Cho Bé Yêu (1-12 tuổi)</h4>
      <p>Những bó hoa nhỏ xinh với tông màu pastel, kết hợp gấu bông hoặc bánh kẹo sẽ khiến các bé thích thú. Hoa hướng dương tượng trưng cho sự vui vẻ, năng động rất phù hợp với tuổi thơ.</p>

      <h4>Cho Tuổi Teen (13-19 tuổi)</h4>
      <p>Hoa hồng phấn, hoa cẩm tú cầu với phong cách Hàn Quốc trendy sẽ là lựa chọn hoàn hảo. Các bạn trẻ yêu thích sự độc đáo và cá tính.</p>

      <h4>Cho Người Trưởng Thành (20-40 tuổi)</h4>
      <p>Hoa hồng đỏ, hoa ly, hoa lan - sang trọng và tinh tế. Đây là độ tuổi đánh giá cao vẻ đẹp cổ điển và ý nghĩa sâu sắc.</p>

      <h4>Cho Người Cao Tuổi (50+ tuổi)</h4>
      <p>Hoa lan hồ điệp, hoa cúc mang ý nghĩa trường thọ, sức khỏe. Màu sắc trang nhã thể hiện sự kính trọng và yêu thương.</p>

      <h3>Gợi Ý Theo Mối Quan Hệ</h3>

      <ul>
        <li><strong>Tặng mẹ:</strong> Hoa cẩm chướng - biểu tượng của tình mẫu tử</li>
        <li><strong>Tặng người yêu:</strong> Hoa hồng đỏ - tình yêu nồng cháy</li>
        <li><strong>Tặng bạn bè:</strong> Hoa hướng dương - tình bạn chân thành</li>
        <li><strong>Tặng đồng nghiệp:</strong> Hoa lily - sự quý mến và tôn trọng</li>
      </ul>

      <h3>Ý Nghĩa Các Loại Hoa Sinh Nhật Phổ Biến</h3>

      <table>
        <tr><th>Loại hoa</th><th>Ý nghĩa</th></tr>
        <tr><td>Hoa hồng</td><td>Tình yêu, sự ngưỡng mộ</td></tr>
        <tr><td>Hoa hướng dương</td><td>Niềm vui, năng lượng tích cực</td></tr>
        <tr><td>Hoa lily</td><td>Sự thuần khiết, may mắn</td></tr>
        <tr><td>Hoa lan</td><td>Sang trọng, cao quý</td></tr>
      </table>

      <h3>Đặt Hoa Ngay Hôm Nay!</h3>

      <p>Tại <strong>MINH ANH</strong>, chúng tôi hiểu rằng mỗi sinh nhật đều đặc biệt. Vì vậy, chúng tôi cam kết:</p>

      <ul>
        <li>Hoa tươi 100%, nhập hàng ngày</li>
        <li>Giao hàng nhanh trong 2 giờ</li>
        <li>Thiết kế theo yêu cầu riêng</li>
        <li>Đính kèm thiệp chúc mừng miễn phí</li>
      </ul>

      <p><em>Hãy để một bó hoa tươi thắm mang đến nụ cười hạnh phúc cho người thân yêu của bạn!</em></p>
    `,
    thumbnail: '/uploads/blogs/hoa-sinh-nhat.jpg',
    category: 'huong-dan',
    tags: ['hoa sinh nhật', 'quà tặng', 'hoa tươi', 'ý nghĩa hoa'],
    status: 'published',
    featured: true,
    metaTitle: 'Hoa Sinh Nhật - Gợi Ý Chọn Hoa Theo Tuổi & Mối Quan Hệ | MINH ANH',
    metaDescription: 'Hướng dẫn chọn hoa sinh nhật phù hợp theo độ tuổi, giới tính. Giao hoa nhanh 2h, thiết kế theo yêu cầu. Đặt hoa sinh nhật tại MINH ANH An Giang.',
  },
  {
    title: 'Hoa Cưới - Điểm Nhấn Hoàn Hảo Cho Ngày Trọng Đại',
    slug: 'hoa-cuoi-diem-nhan-hoan-hao',
    excerpt: 'Bí quyết chọn hoa cưới sang trọng, ý nghĩa. Từ hoa cầm tay cô dâu đến hoa trang trí lễ cưới - tất cả đều góp phần tạo nên ngày cưới hoàn hảo.',
    content: `
      <h2>Hoa Cưới - Ngôn Ngữ Tình Yêu Trong Ngày Trọng Đại</h2>

      <p>Đám cưới là ngày trọng đại nhất trong cuộc đời, và hoa cưới chính là điểm nhấn không thể thiếu để tôn vinh vẻ đẹp lãng mạn của tình yêu. Hãy cùng MINH ANH khám phá thế giới hoa cưới tinh tế!</p>

      <h3>Hoa Cầm Tay Cô Dâu - Biểu Tượng Của Hạnh Phúc</h3>

      <p>Bó hoa cầm tay là phụ kiện quan trọng nhất, thể hiện phong cách và cá tính của cô dâu.</p>

      <h4>Các Kiểu Bó Hoa Phổ Biến:</h4>
      <ul>
        <li><strong>Bó tròn (Round Bouquet):</strong> Cổ điển, sang trọng - phù hợp mọi dáng váy</li>
        <li><strong>Bó cascade:</strong> Hoa rủ dài - hoàn hảo với váy đuôi cá</li>
        <li><strong>Bó tự nhiên (Garden Style):</strong> Tươi mới, phóng khoáng - cho đám cưới ngoài trời</li>
        <li><strong>Bó đơn giản:</strong> Tinh tế, thanh lịch - cho cô dâu yêu sự tối giản</li>
      </ul>

      <h3>Hoa Trang Trí Lễ Cưới</h3>

      <h4>Cổng Hoa Cưới</h4>
      <p>Cổng hoa là điểm check-in ấn tượng, tạo không gian lãng mạn cho buổi lễ. Thường sử dụng hoa hồng, hoa baby, lá xanh tạo điểm nhấn.</p>

      <h4>Hoa Bàn Tiệc</h4>
      <p>Hoa trang trí bàn tiệc cần hài hòa với tone màu chủ đạo, không quá cao để khách có thể trò chuyện thoải mái.</p>

      <h4>Xe Hoa Cưới</h4>
      <p>Xe hoa được trang trí theo chủ đề, thường dùng hoa hồng, hoa lan kết hợp lá và ruy băng.</p>

      <h3>Ý Nghĩa Màu Sắc Hoa Cưới</h3>

      <ul>
        <li><strong>Trắng:</strong> Thuần khiết, trong sáng - lựa chọn truyền thống</li>
        <li><strong>Hồng nhạt:</strong> Ngọt ngào, nữ tính - lãng mạn</li>
        <li><strong>Đỏ:</strong> Đam mê, may mắn - phù hợp đám cưới truyền thống</li>
        <li><strong>Champagne:</strong> Sang trọng, tinh tế - xu hướng hiện đại</li>
      </ul>

      <h3>Loại Hoa Cưới Được Yêu Thích</h3>

      <ul>
        <li><strong>Hoa hồng:</strong> Biểu tượng vĩnh cửu của tình yêu</li>
        <li><strong>Hoa mẫu đơn (Peony):</strong> Hạnh phúc, thịnh vượng</li>
        <li><strong>Hoa lan hồ điệp:</strong> Sang trọng, quý phái</li>
        <li><strong>Hoa baby:</strong> Thuần khiết, dễ thương</li>
        <li><strong>Hoa cẩm tú cầu:</strong> Sự biết ơn, chân thành</li>
      </ul>

      <h3>Dịch Vụ Hoa Cưới Tại MINH ANH</h3>

      <p>Chúng tôi đồng hành cùng bạn trong ngày trọng đại với:</p>

      <ul>
        <li>Tư vấn miễn phí theo concept đám cưới</li>
        <li>Thiết kế độc quyền theo yêu cầu</li>
        <li>Hoa tươi nhập khẩu chất lượng cao</li>
        <li>Setup trọn gói tại địa điểm</li>
        <li>Hỗ trợ cô dâu trong ngày cưới</li>
      </ul>

      <p><em>Liên hệ ngay để được tư vấn và báo giá chi tiết cho ngày cưới hoàn hảo của bạn!</em></p>
    `,
    thumbnail: '/uploads/blogs/hoa-cuoi.jpg',
    category: 'huong-dan',
    tags: ['hoa cưới', 'hoa cầm tay', 'trang trí cưới', 'cô dâu'],
    status: 'published',
    featured: true,
    metaTitle: 'Hoa Cưới Đẹp - Hoa Cầm Tay Cô Dâu, Trang Trí Lễ Cưới | MINH ANH',
    metaDescription: 'Dịch vụ hoa cưới trọn gói: hoa cầm tay cô dâu, cổng hoa, xe hoa, trang trí tiệc cưới. Thiết kế theo concept, giao hàng tận nơi tại An Giang.',
  },
  {
    title: 'Hoa Khai Trương - Khởi Đầu May Mắn, Phát Tài Phát Lộc',
    slug: 'hoa-khai-truong-may-man-phat-tai',
    excerpt: 'Gợi ý chọn hoa khai trương mang ý nghĩa may mắn, thịnh vượng. Phù hợp tặng đối tác, bạn bè, khách hàng trong ngày khai trương.',
    content: `
      <h2>Hoa Khai Trương - Gửi Gắm Lời Chúc Thịnh Vượng</h2>

      <p>Khai trương là bước ngoặt quan trọng, đánh dấu sự khởi đầu mới đầy hứa hẹn. Một lẵng hoa khai trương đẹp không chỉ là lời chúc mừng, mà còn mang theo những ước nguyện tốt đẹp về sự thành công và thịnh vượng.</p>

      <h3>Ý Nghĩa Các Loại Hoa Khai Trương</h3>

      <h4>Hoa Lan Hồ Điệp</h4>
      <p><strong>Ý nghĩa:</strong> Sang trọng, thành đạt, phú quý. Hoa lan là lựa chọn hàng đầu cho khai trương vì vẻ đẹp quý phái và tuổi thọ lâu dài.</p>

      <h4>Hoa Hướng Dương</h4>
      <p><strong>Ý nghĩa:</strong> Năng lượng tích cực, thành công rực rỡ. Màu vàng tượng trưng cho vàng bạc, tài lộc.</p>

      <h4>Hoa Đồng Tiền</h4>
      <p><strong>Ý nghĩa:</strong> Tài lộc, may mắn, tiền vào như nước. Đúng như tên gọi, hoa đồng tiền là biểu tượng của sự giàu có.</p>

      <h4>Hoa Lily</h4>
      <p><strong>Ý nghĩa:</strong> Thuận lợi, hanh thông. Lily trắng mang đến sự tinh khiết và may mắn trong kinh doanh.</p>

      <h3>Ý Nghĩa Màu Sắc</h3>

      <ul>
        <li><strong>Vàng:</strong> Vàng bạc, tài lộc, phú quý - MÀU PHONG THỦY SỐ 1</li>
        <li><strong>Đỏ:</strong> May mắn, hưng vượng, xua đuổi tà khí</li>
        <li><strong>Cam:</strong> Năng lượng, sáng tạo, thành công</li>
        <li><strong>Tím:</strong> Cao quý, sang trọng, quyền lực</li>
      </ul>

      <h3>Các Mẫu Hoa Khai Trương Phổ Biến</h3>

      <h4>Kệ Hoa Khai Trương</h4>
      <p>Kệ hoa 2-3 tầng hoành tráng, thường dùng cho khai trương công ty, nhà hàng, showroom. Thể hiện sự trọng thị và quy mô.</p>

      <h4>Lẵng Hoa Khai Trương</h4>
      <p>Lẵng hoa vừa phải, phù hợp văn phòng, cửa hàng nhỏ. Sang trọng nhưng không chiếm nhiều diện tích.</p>

      <h4>Chậu Lan Hồ Điệp</h4>
      <p>Chậu lan 5-10 cành, tươi lâu 1-2 tháng. Đẳng cấp và ý nghĩa, thể hiện mối quan hệ lâu dài.</p>

      <h3>Gợi Ý Theo Đối Tượng</h3>

      <ul>
        <li><strong>Đối tác kinh doanh:</strong> Kệ hoa lớn, chậu lan cao cấp - thể hiện sự tôn trọng</li>
        <li><strong>Bạn bè:</strong> Lẵng hoa vừa, thiết kế trẻ trung</li>
        <li><strong>Khách hàng VIP:</strong> Hoa nhập khẩu, thiết kế độc quyền</li>
      </ul>

      <h3>Dịch Vụ Hoa Khai Trương MINH ANH</h3>

      <ul>
        <li>Giao hoa đúng giờ khai trương</li>
        <li>Kèm băng rôn, thiệp chúc mừng</li>
        <li>Tư vấn chọn hoa theo phong thủy</li>
        <li>Giá cả minh bạch, cạnh tranh</li>
        <li>Hỗ trợ setup tại địa điểm</li>
      </ul>

      <p><strong>Hotline đặt hoa: 0839.477.199</strong> - Giao hoa nhanh trong ngày!</p>
    `,
    thumbnail: '/uploads/blogs/hoa-khai-truong.jpg',
    category: 'huong-dan',
    tags: ['hoa khai trương', 'chúc mừng', 'may mắn', 'phát tài'],
    status: 'published',
    featured: true,
    metaTitle: 'Hoa Khai Trương Đẹp - Lẵng Hoa, Kệ Hoa Chúc Mừng | MINH ANH',
    metaDescription: 'Hoa khai trương đẹp, ý nghĩa may mắn phát tài. Kệ hoa, lẵng hoa, chậu lan hồ điệp. Giao hoa đúng giờ, kèm băng rôn chúc mừng. Đặt hoa tại An Giang.',
  },
  {
    title: 'Hoa Chia Buồn - Lời Sẻ Chia Trong Nỗi Mất Mát',
    slug: 'hoa-chia-buon-loi-se-chia',
    excerpt: 'Hướng dẫn chọn hoa chia buồn, viếng tang phù hợp, thể hiện sự tôn kính và đồng cảm với gia đình người đã khuất.',
    content: `
      <h2>Hoa Chia Buồn - Thay Lời Muốn Nói</h2>

      <p>Trong những lúc đau buồn, đôi khi lời nói không thể diễn tả hết được sự sẻ chia. Một vòng hoa, một lẵng hoa chia buồn chính là cách để chúng ta thể hiện sự đồng cảm và tiễn đưa người đã khuất về nơi an nghỉ cuối cùng.</p>

      <h3>Các Loại Hoa Viếng Tang Phổ Biến</h3>

      <h4>Vòng Hoa Viếng</h4>
      <p>Vòng hoa tròn hoặc hình tròn dựng, thường được đặt tại nơi tang lễ. Biểu tượng cho sự vĩnh hằng và lòng thành kính.</p>

      <h4>Lẵng Hoa Chia Buồn</h4>
      <p>Lẵng hoa dạng cao, trang nhã. Phù hợp khi không tiện đến viếng trực tiếp, có thể gửi đến gia đình.</p>

      <h4>Kệ Hoa Tang</h4>
      <p>Kệ hoa nhiều tầng, trang trọng. Thường được đặt bởi cơ quan, tổ chức hoặc người thân thiết.</p>

      <h3>Loại Hoa Thường Dùng</h3>

      <ul>
        <li><strong>Hoa cúc trắng:</strong> Sự thuần khiết, lòng thành kính</li>
        <li><strong>Hoa ly trắng:</strong> Sự tiễn biệt, thanh thản</li>
        <li><strong>Hoa hồng trắng:</strong> Tình cảm trong sáng, tưởng nhớ</li>
        <li><strong>Hoa lan trắng:</strong> Sự cao quý, tôn kính</li>
        <li><strong>Hoa cẩm chướng:</strong> Nỗi nhớ và tình thương</li>
      </ul>

      <h3>Màu Sắc Phù Hợp</h3>

      <p>Trong văn hóa Việt Nam, hoa chia buồn thường sử dụng các tông màu:</p>

      <ul>
        <li><strong>Trắng:</strong> Màu chủ đạo, tượng trưng cho sự thuần khiết và tiễn biệt</li>
        <li><strong>Vàng nhạt:</strong> Thể hiện sự tôn kính</li>
        <li><strong>Tím nhạt:</strong> Nỗi buồn sâu lắng, trang nghiêm</li>
      </ul>

      <p><em>Lưu ý: Tránh sử dụng màu đỏ, hồng đậm hoặc các màu rực rỡ.</em></p>

      <h3>Lời Chia Buồn Trên Băng Rôn</h3>

      <p>Một số mẫu câu thường dùng:</p>

      <ul>
        <li>"Vô cùng thương tiếc..."</li>
        <li>"Xin chia buồn cùng gia đình..."</li>
        <li>"Thành kính phân ưu..."</li>
        <li>"Kính viếng hương hồn..."</li>
      </ul>

      <h3>Dịch Vụ Tại MINH ANH</h3>

      <p>Chúng tôi hiểu sự trang nghiêm của tang lễ, vì vậy cam kết:</p>

      <ul>
        <li>Giao hoa đúng giờ, tận nơi</li>
        <li>Hoa tươi, trình bày trang trọng</li>
        <li>Kèm băng rôn, thiệp chia buồn theo yêu cầu</li>
        <li>Tư vấn tận tình, chu đáo</li>
        <li>Hỗ trợ 24/7 cho các trường hợp cấp bách</li>
      </ul>

      <p><em>Chúng tôi đồng hành cùng bạn trong những lúc khó khăn nhất.</em></p>
    `,
    thumbnail: '/uploads/blogs/hoa-chia-buon.jpg',
    category: 'huong-dan',
    tags: ['hoa chia buồn', 'hoa viếng', 'tang lễ', 'vòng hoa'],
    status: 'published',
    featured: false,
    metaTitle: 'Hoa Chia Buồn, Vòng Hoa Viếng Tang Trang Trọng | MINH ANH',
    metaDescription: 'Dịch vụ hoa chia buồn, vòng hoa viếng tang trang trọng, giao hoa tận nơi. Kèm băng rôn, thiệp chia buồn. Hỗ trợ 24/7 tại An Giang.',
  },
  {
    title: 'Hoa Tình Yêu - Ngôn Ngữ Lãng Mạn Của Trái Tim',
    slug: 'hoa-tinh-yeu-ngon-ngu-lang-man',
    excerpt: 'Khám phá ý nghĩa từng loại hoa tình yêu, số lượng hoa và cách chọn hoa phù hợp để tỏ tình, kỷ niệm hoặc Valentine.',
    content: `
      <h2>Hoa Tình Yêu - Khi Trái Tim Lên Tiếng</h2>

      <p>Từ ngàn đời nay, hoa luôn là sứ giả của tình yêu. Một bông hồng đỏ thắm, một bó hoa rực rỡ - đó là cách tuyệt vời nhất để nói "Anh yêu em" hay "Em yêu anh".</p>

      <h3>Hoa Hồng - Nữ Hoàng Của Tình Yêu</h3>

      <h4>Ý Nghĩa Theo Màu Sắc</h4>

      <ul>
        <li><strong>Hoa hồng đỏ:</strong> Tình yêu nồng cháy, đam mê mãnh liệt</li>
        <li><strong>Hoa hồng hồng:</strong> Tình yêu ngọt ngào, sự biết ơn</li>
        <li><strong>Hoa hồng trắng:</strong> Tình yêu thuần khiết, sự chân thành</li>
        <li><strong>Hoa hồng vàng:</strong> Tình bạn, niềm vui, sự quan tâm</li>
        <li><strong>Hoa hồng cam:</strong> Đam mê, nhiệt huyết, sự khao khát</li>
        <li><strong>Hoa hồng tím:</strong> Tiếng sét ái tình, mê hoặc</li>
      </ul>

      <h4>Ý Nghĩa Theo Số Lượng</h4>

      <ul>
        <li><strong>1 bông:</strong> Em là duy nhất</li>
        <li><strong>3 bông:</strong> Anh yêu em (I Love You)</li>
        <li><strong>9 bông:</strong> Yêu em mãi mãi</li>
        <li><strong>11 bông:</strong> Em là số 1 của anh</li>
        <li><strong>21 bông:</strong> Yêu em chân thành nhất</li>
        <li><strong>33 bông:</strong> Yêu em 3 kiếp</li>
        <li><strong>52 bông:</strong> Yêu em mỗi tuần trong năm</li>
        <li><strong>99 bông:</strong> Yêu em đến vô cùng</li>
        <li><strong>108 bông:</strong> Hãy lấy anh nhé!</li>
        <li><strong>999 bông:</strong> Yêu em vĩnh viễn</li>
      </ul>

      <h3>Các Loại Hoa Tình Yêu Khác</h3>

      <h4>Hoa Tulip</h4>
      <p>Tình yêu hoàn hảo. Tulip đỏ - lời tỏ tình, Tulip vàng - tình yêu vô vọng nhưng vẫn hy vọng.</p>

      <h4>Hoa Cẩm Tú Cầu</h4>
      <p>Sự biết ơn và chân thành trong tình yêu. Phù hợp tặng trong những dịp đặc biệt.</p>

      <h4>Hoa Baby</h4>
      <p>Tình yêu thuần khiết, trong trắng. Thường kết hợp với hoa hồng để tăng sự lãng mạn.</p>

      <h3>Dịp Tặng Hoa Tình Yêu</h3>

      <ul>
        <li><strong>Valentine 14/2:</strong> Ngày của tình yêu - hoa hồng đỏ là số 1</li>
        <li><strong>Kỷ niệm ngày yêu:</strong> Số bông = số tháng/năm yêu nhau</li>
        <li><strong>Tỏ tình:</strong> 1 bông hoặc 99 bông - đều mang ý nghĩa đặc biệt</li>
        <li><strong>Xin lỗi:</strong> Hoa hồng vàng + hồng trắng</li>
        <li><strong>Cầu hôn:</strong> 108 bông hoa hồng đỏ</li>
      </ul>

      <h3>Mẹo Tặng Hoa Lãng Mạn</h3>

      <ul>
        <li>Tặng bất ngờ tại nơi làm việc - ghi điểm 100%</li>
        <li>Kèm thiệp viết tay với lời yêu thương</li>
        <li>Chọn hoa theo sở thích của người ấy</li>
        <li>Đặt giao hoa đúng giờ hẹn hò</li>
      </ul>

      <h3>Đặt Hoa Tình Yêu Tại MINH ANH</h3>

      <ul>
        <li>Hoa hồng Ecuador nhập khẩu</li>
        <li>Thiết kế độc quyền, lãng mạn</li>
        <li>Giao hoa bí mật, bất ngờ</li>
        <li>Đính kèm chocolate, gấu bông</li>
        <li>Phục vụ 24/7 cho Valentine</li>
      </ul>

      <p><em>Hãy để MINH ANH giúp bạn gửi gắm tình yêu qua những đóa hoa tươi thắm!</em></p>
    `,
    thumbnail: '/uploads/blogs/hoa-tinh-yeu.jpg',
    category: 'huong-dan',
    tags: ['hoa tình yêu', 'valentine', 'hoa hồng', 'tỏ tình', 'lãng mạn'],
    status: 'published',
    featured: true,
    metaTitle: 'Hoa Tình Yêu - Ý Nghĩa Số Lượng Hoa Hồng, Màu Sắc | MINH ANH',
    metaDescription: 'Ý nghĩa hoa tình yêu theo màu sắc và số lượng. Hoa Valentine, tỏ tình, kỷ niệm. Giao hoa bất ngờ, lãng mạn tại An Giang.',
  },
  {
    title: 'Mẹo Bảo Quản Hoa Tươi Lâu Tàn Tại Nhà',
    slug: 'meo-bao-quan-hoa-tuoi-lau-tan',
    excerpt: 'Chia sẻ các mẹo giữ hoa tươi lâu từ 7-14 ngày. Cách cắm hoa, thay nước, và chăm sóc hoa đúng cách.',
    content: `
      <h2>Bí Quyết Giữ Hoa Tươi Lâu Như Mới Mua</h2>

      <p>Bạn vừa nhận được một bó hoa tươi đẹp và muốn nó tươi lâu nhất có thể? Hãy áp dụng ngay những mẹo hay dưới đây từ MINH ANH!</p>

      <h3>Bước 1: Xử Lý Hoa Ngay Khi Nhận</h3>

      <ul>
        <li>Tháo bỏ giấy gói, giữ lại phần bọc bảo vệ gốc</li>
        <li>Cắt chéo cuống hoa khoảng 2-3cm bằng kéo sắc</li>
        <li>Loại bỏ lá dưới mực nước để tránh thối</li>
        <li>Ngâm hoa vào nước mát 30 phút trước khi cắm</li>
      </ul>

      <h3>Bước 2: Chuẩn Bị Bình Hoa</h3>

      <ul>
        <li>Rửa sạch bình bằng nước ấm và xà phòng</li>
        <li>Dùng bình có miệng vừa để hoa đứng thẳng</li>
        <li>Đổ nước sạch ở nhiệt độ phòng (không dùng nước đá)</li>
        <li>Mực nước = 2/3 chiều dài cuống hoa</li>
      </ul>

      <h3>Bước 3: Các Chất Bảo Quản Tự Nhiên</h3>

      <h4>Đường + Giấm</h4>
      <p>1 muỗng đường + vài giọt giấm/1 lít nước. Đường cung cấp dinh dưỡng, giấm diệt vi khuẩn.</p>

      <h4>Aspirin</h4>
      <p>Nghiền 1 viên aspirin/1 lít nước. Giúp hoa hấp thụ nước tốt hơn.</p>

      <h4>Nước ngọt có ga (7Up, Sprite)</h4>
      <p>Pha 1:3 với nước lọc. Đường trong nước ngọt nuôi dưỡng hoa.</p>

      <h4>Bleach (Nước tẩy)</h4>
      <p>Vài giọt bleach/1 lít nước. Diệt khuẩn hiệu quả, giữ nước trong.</p>

      <h3>Bước 4: Vị Trí Đặt Hoa</h3>

      <ul>
        <li><strong>Tránh:</strong> Ánh nắng trực tiếp, gần cửa sổ</li>
        <li><strong>Tránh:</strong> Gần trái cây chín (khí ethylene làm hoa mau tàn)</li>
        <li><strong>Tránh:</strong> Gần quạt, máy lạnh (hoa mất nước nhanh)</li>
        <li><strong>Nên:</strong> Nơi thoáng mát, ánh sáng dịu</li>
      </ul>

      <h3>Bước 5: Chăm Sóc Hàng Ngày</h3>

      <ul>
        <li>Thay nước mỗi 2 ngày</li>
        <li>Cắt lại cuống 1cm mỗi lần thay nước</li>
        <li>Loại bỏ hoa, lá héo úa</li>
        <li>Giữ nước luôn trong, không đục</li>
      </ul>

      <h3>Thời Gian Tươi Của Từng Loại Hoa</h3>

      <table>
        <tr><th>Loại hoa</th><th>Thời gian tươi</th></tr>
        <tr><td>Hoa hồng</td><td>5-7 ngày</td></tr>
        <tr><td>Hoa lily</td><td>7-10 ngày</td></tr>
        <tr><td>Hoa cúc</td><td>10-14 ngày</td></tr>
        <tr><td>Hoa lan</td><td>2-4 tuần</td></tr>
        <tr><td>Hoa hướng dương</td><td>7-10 ngày</td></tr>
        <tr><td>Hoa cẩm tú cầu</td><td>5-7 ngày</td></tr>
      </table>

      <h3>Mẹo Đặc Biệt</h3>

      <ul>
        <li><strong>Hoa hồng:</strong> Cắm cành chéo, ngâm đầu vào nước nóng 30 giây trước khi cắm</li>
        <li><strong>Hoa cẩm tú cầu:</strong> Phun sương lên cánh hoa 2 lần/ngày</li>
        <li><strong>Hoa lily:</strong> Cắt bỏ nhị hoa để tránh dính phấn và tăng tuổi thọ</li>
        <li><strong>Hoa lan:</strong> Tưới ít nước, để nơi có ánh sáng gián tiếp</li>
      </ul>

      <p><em>Áp dụng đúng cách, hoa của bạn sẽ tươi lâu gấp đôi!</em></p>
    `,
    thumbnail: '/uploads/blogs/bao-quan-hoa.jpg',
    category: 'meo-hay',
    tags: ['bảo quản hoa', 'hoa tươi lâu', 'mẹo hay', 'chăm sóc hoa'],
    status: 'published',
    featured: false,
    metaTitle: 'Mẹo Bảo Quản Hoa Tươi Lâu 7-14 Ngày Tại Nhà | MINH ANH',
    metaDescription: 'Hướng dẫn cách giữ hoa tươi lâu tại nhà. Mẹo thay nước, cắt cuống, chất bảo quản tự nhiên. Thời gian tươi của từng loại hoa.',
  },
  {
    title: 'Hoa Quà Tặng - Hoa Sự Kiện: Gợi Ý Cho Mọi Dịp',
    slug: 'hoa-qua-tang-hoa-su-kien',
    excerpt: 'Hướng dẫn chọn hoa quà tặng phù hợp cho các dịp đặc biệt: thăm bệnh, chúc mừng, cảm ơn, sự kiện công ty, hội nghị.',
    content: `
      <h2>Hoa Quà Tặng - Món Quà Ý Nghĩa Cho Mọi Dịp</h2>

      <p>Hoa luôn là món quà được yêu thích bởi sự tươi đẹp và ý nghĩa mà nó mang lại. Dù là thăm người ốm, chúc mừng thành công hay tổ chức sự kiện, hoa đều là lựa chọn hoàn hảo.</p>

      <h3>Hoa Thăm Bệnh - Gửi Gắm Lời Chúc Bình An</h3>

      <h4>Loại Hoa Phù Hợp</h4>
      <ul>
        <li><strong>Hoa hướng dương:</strong> Năng lượng tích cực, sớm khỏe mạnh</li>
        <li><strong>Hoa cúc:</strong> Trường thọ, sức khỏe dồi dào</li>
        <li><strong>Hoa lan:</strong> Sự quan tâm, tôn trọng</li>
        <li><strong>Hoa đồng tiền:</strong> May mắn, mau chóng bình phục</li>
      </ul>

      <h4>Lưu Ý Khi Tặng Hoa Thăm Bệnh</h4>
      <ul>
        <li>Tránh hoa có mùi quá nồng (huệ tây, lily)</li>
        <li>Chọn tông màu tươi sáng: vàng, cam, hồng nhạt</li>
        <li>Tránh hoa trắng thuần (dễ liên tưởng tang lễ)</li>
        <li>Bó hoa vừa phải, không quá lớn</li>
      </ul>

      <h3>Hoa Chúc Mừng Thành Công</h3>

      <h4>Các Dịp Chúc Mừng</h4>
      <ul>
        <li><strong>Tốt nghiệp:</strong> Hoa hồng, hoa hướng dương - tương lai rực rỡ</li>
        <li><strong>Thăng chức:</strong> Hoa lan, hoa lily - thành công, đẳng cấp</li>
        <li><strong>Đậu đại học:</strong> Hoa cẩm tú cầu, baby - thanh xuân tươi đẹp</li>
        <li><strong>Hoàn thành dự án:</strong> Lẵng hoa sang trọng - ghi nhận nỗ lực</li>
      </ul>

      <h3>Hoa Cảm Ơn - Tri Ân</h3>

      <p>Một bó hoa cảm ơn thay cho ngàn lời nói:</p>

      <ul>
        <li><strong>Cảm ơn thầy cô:</strong> Hoa hồng, hoa cẩm chướng</li>
        <li><strong>Cảm ơn đồng nghiệp:</strong> Hoa hướng dương, hoa đồng tiền</li>
        <li><strong>Cảm ơn khách hàng:</strong> Lẵng hoa sang trọng, chậu lan</li>
        <li><strong>Cảm ơn cha mẹ:</strong> Hoa cẩm chướng, hoa hồng</li>
      </ul>

      <h3>Hoa Cho Sự Kiện - Hội Nghị</h3>

      <h4>Sự Kiện Công Ty</h4>
      <ul>
        <li><strong>Hội nghị khách hàng:</strong> Lẵng hoa bàn, backdrop hoa</li>
        <li><strong>Lễ ký kết:</strong> Hoa trang trí bàn ký, sân khấu</li>
        <li><strong>Tiệc cuối năm:</strong> Hoa trang trí không gian, bàn tiệc</li>
        <li><strong>Workshop:</strong> Hoa tươi nhỏ xinh trang trí góc check-in</li>
      </ul>

      <h4>Sự Kiện Gia Đình</h4>
      <ul>
        <li><strong>Tiệc thôi nôi:</strong> Hoa tông pastel, phong cách dễ thương</li>
        <li><strong>Tiệc mừng thọ:</strong> Hoa lan, hoa cúc - trường thọ</li>
        <li><strong>Tân gia:</strong> Chậu cây, lẵng hoa - thịnh vượng</li>
      </ul>

      <h3>Dịch Vụ Tại MINH ANH</h3>

      <ul>
        <li>Tư vấn chọn hoa theo từng dịp</li>
        <li>Thiết kế theo yêu cầu, concept</li>
        <li>Giao hoa tận nơi, đúng giờ</li>
        <li>Nhận trang trí sự kiện trọn gói</li>
        <li>Hỗ trợ viết thiệp chúc mừng</li>
      </ul>

      <p><em>Mọi dịp đều xứng đáng có hoa tươi - Đặt hoa ngay tại MINH ANH!</em></p>
    `,
    thumbnail: '/uploads/blogs/hoa-qua-tang.jpg',
    category: 'huong-dan',
    tags: ['hoa quà tặng', 'hoa sự kiện', 'thăm bệnh', 'chúc mừng', 'hội nghị'],
    status: 'published',
    featured: false,
    metaTitle: 'Hoa Quà Tặng, Hoa Sự Kiện - Gợi Ý Cho Mọi Dịp | MINH ANH',
    metaDescription: 'Gợi ý chọn hoa quà tặng cho các dịp: thăm bệnh, chúc mừng, cảm ơn, sự kiện công ty. Giao hoa tận nơi, trang trí sự kiện tại An Giang.',
  },
  {
    title: 'Hoa Trang Trí - Hoa Văn Phòng: Mang Thiên Nhiên Vào Không Gian Sống',
    slug: 'hoa-trang-tri-hoa-van-phong',
    excerpt: 'Gợi ý các loại hoa trang trí nhà cửa, văn phòng đẹp và dễ chăm sóc. Cách bố trí hoa theo phong thủy và phong cách.',
    content: `
      <h2>Hoa Trang Trí - Làm Đẹp Không Gian, Nâng Tầm Cuộc Sống</h2>

      <p>Hoa tươi không chỉ đẹp mà còn mang lại năng lượng tích cực, thanh lọc không khí và tạo cảm hứng làm việc. Hãy để MINH ANH gợi ý những loại hoa phù hợp cho không gian của bạn!</p>

      <h3>Hoa Trang Trí Phòng Khách</h3>

      <h4>Loại Hoa Phù Hợp</h4>
      <ul>
        <li><strong>Hoa lily:</strong> Sang trọng, thơm nhẹ nhàng</li>
        <li><strong>Hoa lan hồ điệp:</strong> Quý phái, tươi lâu 1-2 tháng</li>
        <li><strong>Hoa cẩm tú cầu:</strong> Hiện đại, nhiều màu sắc</li>
        <li><strong>Hoa hướng dương:</strong> Tươi vui, năng động</li>
      </ul>

      <h4>Vị Trí Đặt Hoa</h4>
      <ul>
        <li>Bàn trà - trung tâm phòng khách</li>
        <li>Kệ TV - điểm nhấn góc phòng</li>
        <li>Cửa ra vào - đón khách ấn tượng</li>
      </ul>

      <h3>Hoa Cho Bàn Ăn</h3>

      <p>Hoa bàn ăn cần tuân theo nguyên tắc:</p>
      <ul>
        <li>Chiều cao thấp - không cản tầm nhìn</li>
        <li>Không mùi quá nồng - ảnh hưởng bữa ăn</li>
        <li>Màu sắc hài hòa với không gian</li>
      </ul>

      <h4>Gợi Ý</h4>
      <ul>
        <li>Hoa hồng mini trong bình thủy tinh</li>
        <li>Hoa baby trắng đơn giản</li>
        <li>Cành lá xanh + vài bông hoa nhỏ</li>
      </ul>

      <h3>Hoa Văn Phòng Làm Việc</h3>

      <h4>Lợi Ích Của Hoa Tại Văn Phòng</h4>
      <ul>
        <li>Giảm stress, tăng năng suất làm việc</li>
        <li>Thanh lọc không khí, tạo oxy</li>
        <li>Tạo ấn tượng tốt với khách hàng</li>
        <li>Không gian làm việc thêm sống động</li>
      </ul>

      <h4>Loại Hoa Phù Hợp Văn Phòng</h4>
      <ul>
        <li><strong>Chậu lan hồ điệp:</strong> Sang trọng, ít cần chăm sóc</li>
        <li><strong>Cây xanh mini:</strong> Kim tiền, lưỡi hổ, phát tài</li>
        <li><strong>Hoa cắm bình:</strong> Hoa đồng tiền, hoa cúc</li>
        <li><strong>Chậu sen đá:</strong> Dễ sống, trang trí bàn làm việc</li>
      </ul>

      <h3>Hoa Theo Phong Thủy</h3>

      <h4>Phòng Khách - Thu Hút Tài Lộc</h4>
      <ul>
        <li>Hướng Đông Nam: Hoa vàng, cam - tài lộc</li>
        <li>Hướng Bắc: Hoa trắng, tím - sự nghiệp</li>
      </ul>

      <h4>Phòng Ngủ - Giấc Ngủ Ngon</h4>
      <ul>
        <li>Hoa lavender: Thư giãn, dễ ngủ</li>
        <li>Hoa nhài: Thanh lọc, dịu nhẹ</li>
        <li>Lưu ý: Tránh hoa có mùi quá nồng</li>
      </ul>

      <h4>Bàn Làm Việc - Tập Trung</h4>
      <ul>
        <li>Cây xanh nhỏ: Tăng sự tập trung</li>
        <li>Hoa màu xanh: Bình tĩnh, sáng tạo</li>
      </ul>

      <h3>Dịch Vụ Hoa Định Kỳ</h3>

      <p>MINH ANH cung cấp dịch vụ hoa định kỳ cho:</p>

      <ul>
        <li><strong>Văn phòng:</strong> Thay hoa hàng tuần/2 tuần</li>
        <li><strong>Nhà hàng, khách sạn:</strong> Hoa tươi mỗi ngày</li>
        <li><strong>Gia đình:</strong> Gói hoa theo tuần/tháng</li>
      </ul>

      <h4>Ưu Điểm</h4>
      <ul>
        <li>Không cần lo chọn hoa, đặt hàng</li>
        <li>Hoa tươi mới, thay đổi theo mùa</li>
        <li>Giá ưu đãi theo gói</li>
        <li>Giao hàng tận nơi, setup sẵn</li>
      </ul>

      <p><em>Liên hệ MINH ANH để được tư vấn gói hoa định kỳ phù hợp với không gian của bạn!</em></p>
    `,
    thumbnail: '/uploads/blogs/hoa-trang-tri.jpg',
    category: 'meo-hay',
    tags: ['hoa trang trí', 'hoa văn phòng', 'phong thủy', 'không gian sống'],
    status: 'published',
    featured: false,
    metaTitle: 'Hoa Trang Trí Nhà Cửa, Văn Phòng - Gợi Ý Theo Phong Thủy | MINH ANH',
    metaDescription: 'Gợi ý hoa trang trí phòng khách, bàn ăn, văn phòng. Hoa theo phong thủy mang lại tài lộc, may mắn. Dịch vụ hoa định kỳ tại An Giang.',
  },
];

async function seedBlogs() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find an admin user to set as author
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found, creating a default author...');
      adminUser = await User.create({
        name: 'Admin',
        email: 'admin@minhanh.store',
        password: 'admin123',
        role: 'admin',
      });
    }
    console.log(`Using author: ${adminUser.name}`);

    // Clear existing blogs
    await Blog.deleteMany({});
    console.log('Cleared existing blogs');

    // Insert new blogs
    for (const blogData of blogs) {
      const blog = new Blog({
        ...blogData,
        author: adminUser._id,
        publishedAt: new Date(),
      });
      await blog.save();
      console.log(`Created blog: ${blog.title}`);
    }

    console.log(`\nSuccessfully seeded ${blogs.length} blogs!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding blogs:', error);
    process.exit(1);
  }
}

seedBlogs();
