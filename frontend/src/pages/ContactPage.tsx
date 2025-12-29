import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiOutlinePhone, HiOutlineMail, HiOutlineLocationMarker } from 'react-icons/hi';

interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactForm>();

  const onSubmit = async (_data: ContactForm) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm nhất.');
    reset();
    setIsSubmitting(false);
  };

  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl mb-4">Liên Hệ Với MINH ANH</h1>
          <p className="text-neutral-600 max-w-xl mx-auto">
            Bạn cần tư vấn về mâm quả cưới, giỏ quà tết, giỏ trái cây hay hoa cưới?
            Chúng tôi luôn sẵn lòng hỗ trợ bạn!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Thông tin liên hệ */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-heading text-xl mb-6">Thông Tin Liên Hệ</h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <HiOutlinePhone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Điện Thoại</h3>
                    <p className="text-neutral-600">0839 477 199</p>
                    <p className="text-neutral-600">Zalo: 0944 600 344</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <HiOutlineMail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Liên Hệ</h3>
                    <a href="https://zalo.me/0944600344" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-primary">Zalo: 0944 600 344</a>
                    <br />
                    <a href="https://www.facebook.com/tu.le.733057" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-primary">Facebook: MINH ANH</a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <HiOutlineLocationMarker className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Địa Chỉ</h3>
                    <p className="text-neutral-600">
                      A0.34 Cô Bắc<br />
                      P.Vĩnh Bảo, Tp.Rạch Giá<br />
                      Kiên Giang
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Mạng xã hội */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-heading text-xl mb-4">Theo Dõi Chúng Tôi</h2>
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com/tu.le.733057"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <span className="text-lg">📘</span>
                </a>
                <a
                  href="https://zalo.me/0944600344"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors"
                >
                  <span className="text-lg">💬</span>
                </a>
              </div>
            </div>
          </div>

          {/* Form liên hệ */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h2 className="font-heading text-xl mb-6">Gửi Tin Nhắn</h2>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Họ Tên *
                  </label>
                  <input
                    type="text"
                    className={`input ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Nguyễn Văn A"
                    {...register('name', { required: 'Vui lòng nhập họ tên' })}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Địa Chỉ Email *
                  </label>
                  <input
                    type="email"
                    className={`input ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="email@example.com"
                    {...register('email', {
                      required: 'Vui lòng nhập email',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Địa chỉ email không hợp lệ',
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+84 912 345 678"
                    {...register('phone')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Chủ Đề *
                  </label>
                  <select
                    className={`input ${errors.subject ? 'border-red-500' : ''}`}
                    {...register('subject', { required: 'Vui lòng chọn chủ đề' })}
                  >
                    <option value="">Chọn chủ đề</option>
                    <option value="general">Câu Hỏi Chung</option>
                    <option value="order">Câu Hỏi Về Đơn Hàng</option>
                    <option value="wedding">Tư Vấn Mâm Quả Cưới</option>
                    <option value="tet">Giỏ Quà Tết</option>
                    <option value="fruit">Giỏ Trái Cây</option>
                    <option value="flowers">Hoa Cưới & Hoa Tươi</option>
                    <option value="feedback">Góp Ý</option>
                  </select>
                  {errors.subject && (
                    <p className="text-sm text-red-500 mt-1">{errors.subject.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Nội Dung *
                  </label>
                  <textarea
                    rows={5}
                    className={`input ${errors.message ? 'border-red-500' : ''}`}
                    placeholder="Cho chúng tôi biết bạn cần hỗ trợ gì..."
                    {...register('message', {
                      required: 'Vui lòng nhập nội dung',
                      minLength: {
                        value: 10,
                        message: 'Nội dung phải có ít nhất 10 ký tự',
                      },
                    })}
                  />
                  {errors.message && (
                    <p className="text-sm text-red-500 mt-1">{errors.message.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full mt-6"
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi Tin Nhắn'}
              </button>
            </form>
          </div>
        </div>

        {/* Google Map */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-heading text-xl mb-4">Vị Trí Cửa Hàng</h2>
            <div className="rounded-xl overflow-hidden h-80">
              <iframe
                src="https://maps.google.com/maps?q=Vĩnh+Bảo,+Rạch+Giá,+Kiên+Giang,+Vietnam&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="MINH ANH Flowers - Vĩnh Bảo, Rạch Giá, Kiên Giang"
              />
            </div>
            <p className="text-sm text-neutral-500 mt-3 text-center">
              A0.34 Cô Bắc, P.Vĩnh Bảo, Tp.Rạch Giá, Kiên Giang
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
