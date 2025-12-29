const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ['flash_sale', 'seasonal', 'holiday', 'clearance', 'bundle'],
      required: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0, // Higher priority promotions take precedence
    },
    // Products included in this promotion
    products: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      // Override promotion discount for specific product
      customDiscount: {
        type: Number,
        default: null,
      },
      stockLimit: {
        type: Number,
        default: null, // Limit stock for flash sale
      },
      soldCount: {
        type: Number,
        default: 0,
      },
    }],
    // Categories included (all products in category get promotion)
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    }],
    // Banner/image for promotion
    bannerImage: {
      type: String,
    },
    bannerImageMobile: {
      type: String,
    },
    // Colors for flash sale countdown styling
    primaryColor: {
      type: String,
      default: '#e11d48', // rose-600
    },
    secondaryColor: {
      type: String,
      default: '#fecdd3', // rose-200
    },
    // Show countdown timer
    showCountdown: {
      type: Boolean,
      default: true,
    },
    // Featured on homepage
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
promotionSchema.index({ slug: 1 });
promotionSchema.index({ type: 1, isActive: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ 'products.product': 1 });

// Virtual: check if promotion is currently active
promotionSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
});

// Virtual: time remaining in seconds
promotionSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  if (now < this.startDate) {
    return {
      status: 'upcoming',
      seconds: Math.floor((this.startDate - now) / 1000),
    };
  }
  if (now > this.endDate) {
    return {
      status: 'ended',
      seconds: 0,
    };
  }
  return {
    status: 'active',
    seconds: Math.floor((this.endDate - now) / 1000),
  };
});

// Static: Get active promotions
promotionSchema.statics.getActivePromotions = async function(type = null) {
  const now = new Date();
  const query = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  };

  if (type) {
    query.type = type;
  }

  return this.find(query)
    .populate('products.product', 'name slug price images stock')
    .populate('categories', 'name slug')
    .sort({ priority: -1, createdAt: -1 });
};

// Static: Get flash sales for homepage
promotionSchema.statics.getFlashSales = async function() {
  const now = new Date();
  return this.find({
    type: 'flash_sale',
    isActive: true,
    isFeatured: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .populate('products.product', 'name slug price salePrice images stock')
    .sort({ priority: -1 })
    .limit(1);
};

// Static: Get promotion for a product
promotionSchema.statics.getProductPromotion = async function(productId) {
  const now = new Date();
  return this.findOne({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    'products.product': productId,
  })
    .populate('products.product', 'name price')
    .sort({ priority: -1 });
};

// Method: Calculate sale price for a product
promotionSchema.methods.getSalePrice = function(productId, originalPrice) {
  const productPromo = this.products.find(
    p => p.product.toString() === productId.toString() || p.product._id?.toString() === productId.toString()
  );

  if (!productPromo) return null;

  // Check stock limit for flash sale
  if (productPromo.stockLimit !== null && productPromo.soldCount >= productPromo.stockLimit) {
    return null; // Sold out
  }

  const discountValue = productPromo.customDiscount !== null
    ? productPromo.customDiscount
    : this.discountValue;

  let salePrice;
  if (this.discountType === 'percentage') {
    salePrice = originalPrice - (originalPrice * discountValue) / 100;
  } else {
    salePrice = originalPrice - discountValue;
  }

  return Math.max(0, Math.round(salePrice));
};

// Method: Record sale
promotionSchema.methods.recordSale = async function(productId, quantity = 1) {
  const productIndex = this.products.findIndex(
    p => p.product.toString() === productId.toString() || p.product._id?.toString() === productId.toString()
  );

  if (productIndex >= 0) {
    this.products[productIndex].soldCount += quantity;
    await this.save();
  }
};

// Ensure virtuals are included
promotionSchema.set('toJSON', { virtuals: true });
promotionSchema.set('toObject', { virtuals: true });

// Pre-save: generate slug if not provided
promotionSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Promotion', promotionSchema);
