const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { protect, admin } = require('../middleware/auth');

// Blog categories mapping
const BLOG_CATEGORIES = {
  'tin-tuc': 'Tin Tức',
  'huong-dan': 'Hướng Dẫn',
  'meo-hay': 'Mẹo Hay',
  'su-kien': 'Sự Kiện',
  'khac': 'Khác',
};

// @route   GET /api/blogs
// @desc    Get all published blogs with pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const tag = req.query.tag;
    const search = req.query.search;
    const featured = req.query.featured;

    // Build query
    const query = { status: 'published' };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const total = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .select('-content') // Exclude full content for list view
      .populate('author', 'name')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      categories: BLOG_CATEGORIES,
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
    });
  }
});

// @route   GET /api/blogs/featured
// @desc    Get featured blogs
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const blogs = await Blog.find({ status: 'published', featured: true })
      .select('-content')
      .populate('author', 'name')
      .sort({ publishedAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.error('Get featured blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
    });
  }
});

// @route   GET /api/blogs/recent
// @desc    Get recent blogs
// @access  Public
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const blogs = await Blog.find({ status: 'published' })
      .select('title slug thumbnail publishedAt category')
      .sort({ publishedAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.error('Get recent blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
    });
  }
});

// ============ ADMIN ROUTES (must be before /:slug) ============

// @route   GET /api/blogs/admin/all
// @desc    Get all blogs (admin)
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = {};
    if (status) {
      query.status = status;
    }

    const total = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      categories: BLOG_CATEGORIES,
    });
  } catch (error) {
    console.error('Admin get blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
    });
  }
});

// @route   GET /api/blogs/admin/:id
// @desc    Get blog by ID (admin)
// @access  Private/Admin
router.get('/admin/:id', protect, admin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'name');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết',
      });
    }

    res.json({
      success: true,
      data: blog,
      categories: BLOG_CATEGORIES,
    });
  } catch (error) {
    console.error('Admin get blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
    });
  }
});

// @route   POST /api/blogs
// @desc    Create new blog
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      thumbnail,
      images,
      category,
      tags,
      status,
      featured,
      metaTitle,
      metaDescription,
    } = req.body;

    const blog = new Blog({
      title,
      excerpt,
      content,
      thumbnail,
      images,
      category,
      tags: tags || [],
      status: status || 'draft',
      featured: featured || false,
      author: req.user._id,
      metaTitle,
      metaDescription,
    });

    await blog.save();

    res.status(201).json({
      success: true,
      data: blog,
      message: 'Tạo bài viết thành công',
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server',
    });
  }
});

// @route   PUT /api/blogs/:id
// @desc    Update blog
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      thumbnail,
      images,
      category,
      tags,
      status,
      featured,
      metaTitle,
      metaDescription,
    } = req.body;

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết',
      });
    }

    // Update fields
    if (title) blog.title = title;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (content) blog.content = content;
    if (thumbnail !== undefined) blog.thumbnail = thumbnail;
    if (images) blog.images = images;
    if (category) blog.category = category;
    if (tags) blog.tags = tags;
    if (status) blog.status = status;
    if (featured !== undefined) blog.featured = featured;
    if (metaTitle !== undefined) blog.metaTitle = metaTitle;
    if (metaDescription !== undefined) blog.metaDescription = metaDescription;

    await blog.save();

    res.json({
      success: true,
      data: blog,
      message: 'Cập nhật bài viết thành công',
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server',
    });
  }
});

// @route   DELETE /api/blogs/:id
// @desc    Delete blog
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết',
      });
    }

    await blog.deleteOne();

    res.json({
      success: true,
      message: 'Xóa bài viết thành công',
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
    });
  }
});

// @route   GET /api/blogs/:slug
// @desc    Get single blog by slug (MUST BE LAST - catches all unmatched routes)
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: 'published',
    }).populate('author', 'name');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết',
      });
    }

    // Increment view count
    blog.views += 1;
    await blog.save();

    // Get related blogs
    const related = await Blog.find({
      _id: { $ne: blog._id },
      status: 'published',
      $or: [
        { category: blog.category },
        { tags: { $in: blog.tags } },
      ],
    })
      .select('title slug thumbnail publishedAt category')
      .limit(4);

    res.json({
      success: true,
      data: {
        blog,
        related,
      },
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
    });
  }
});

module.exports = router;
