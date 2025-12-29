const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề bài viết là bắt buộc'],
      trim: true,
      maxLength: [200, 'Tiêu đề không được quá 200 ký tự'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      maxLength: [500, 'Mô tả tóm tắt không được quá 500 ký tự'],
    },
    content: {
      type: String,
      required: [true, 'Nội dung bài viết là bắt buộc'],
    },
    thumbnail: {
      type: String,
      default: '',
    },
    images: [{
      type: String,
    }],
    category: {
      type: String,
      enum: ['tin-tuc', 'huong-dan', 'meo-hay', 'su-kien', 'khac'],
      default: 'tin-tuc',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
    },
    metaTitle: {
      type: String,
      maxLength: [70, 'Meta title không được quá 70 ký tự'],
    },
    metaDescription: {
      type: String,
      maxLength: [160, 'Meta description không được quá 160 ký tự'],
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from title
blogSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

// Index for search
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });
blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1 });

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
