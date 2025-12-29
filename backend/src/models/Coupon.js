const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
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
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // null = no limit
    },
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    usageLimitPerUser: {
      type: Number,
      default: 1,
    },
    usedByUsers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      count: {
        type: Number,
        default: 1,
      },
      lastUsedAt: {
        type: Date,
        default: Date.now,
      },
    }],
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
    applicableCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    }],
    applicableProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    }],
    excludedProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    }],
    // For guest users - track by phone number
    usedByGuests: [{
      phone: String,
      count: {
        type: Number,
        default: 1,
      },
      lastUsedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Virtual to check if coupon is currently valid
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
});

// Method to validate coupon for a specific order
couponSchema.methods.validateForOrder = function(orderAmount, userId, userPhone, cartItems = []) {
  const now = new Date();
  const errors = [];

  // Check if active
  if (!this.isActive) {
    errors.push('Mã giảm giá không còn hoạt động');
  }

  // Check date range
  if (now < this.startDate) {
    errors.push('Mã giảm giá chưa có hiệu lực');
  }
  if (now > this.endDate) {
    errors.push('Mã giảm giá đã hết hạn');
  }

  // Check usage limit
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
    errors.push('Mã giảm giá đã hết lượt sử dụng');
  }

  // Check minimum order amount
  if (orderAmount < this.minOrderAmount) {
    errors.push(`Đơn hàng tối thiểu ${this.minOrderAmount.toLocaleString('vi-VN')}đ`);
  }

  // Check per-user usage limit
  if (userId) {
    const userUsage = this.usedByUsers.find(u => u.user.toString() === userId.toString());
    if (userUsage && userUsage.count >= this.usageLimitPerUser) {
      errors.push('Bạn đã sử dụng hết lượt cho mã này');
    }
  } else if (userPhone) {
    const guestUsage = this.usedByGuests.find(g => g.phone === userPhone);
    if (guestUsage && guestUsage.count >= this.usageLimitPerUser) {
      errors.push('Số điện thoại này đã sử dụng hết lượt cho mã giảm giá');
    }
  }

  // Check applicable products/categories
  if (this.applicableProducts.length > 0 || this.applicableCategories.length > 0) {
    const hasApplicableItem = cartItems.some(item => {
      if (this.applicableProducts.length > 0) {
        return this.applicableProducts.some(p => p.toString() === item.product.toString());
      }
      if (this.applicableCategories.length > 0 && item.category) {
        return this.applicableCategories.some(c => c.toString() === item.category.toString());
      }
      return false;
    });

    if (!hasApplicableItem && cartItems.length > 0) {
      errors.push('Mã giảm giá không áp dụng cho sản phẩm trong giỏ hàng');
    }
  }

  // Check excluded products
  if (this.excludedProducts.length > 0) {
    const allExcluded = cartItems.every(item =>
      this.excludedProducts.some(p => p.toString() === item.product.toString())
    );
    if (allExcluded && cartItems.length > 0) {
      errors.push('Mã giảm giá không áp dụng cho sản phẩm trong giỏ hàng');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(orderAmount) {
  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
  } else {
    discount = this.discountValue;
  }

  // Apply max discount cap if set
  if (this.maxDiscountAmount !== null && discount > this.maxDiscountAmount) {
    discount = this.maxDiscountAmount;
  }

  // Discount cannot exceed order amount
  if (discount > orderAmount) {
    discount = orderAmount;
  }

  return Math.round(discount);
};

// Method to record usage
couponSchema.methods.recordUsage = async function(userId, userPhone) {
  this.usedCount += 1;

  if (userId) {
    const userUsageIndex = this.usedByUsers.findIndex(
      u => u.user.toString() === userId.toString()
    );
    if (userUsageIndex >= 0) {
      this.usedByUsers[userUsageIndex].count += 1;
      this.usedByUsers[userUsageIndex].lastUsedAt = new Date();
    } else {
      this.usedByUsers.push({
        user: userId,
        count: 1,
        lastUsedAt: new Date(),
      });
    }
  } else if (userPhone) {
    const guestUsageIndex = this.usedByGuests.findIndex(g => g.phone === userPhone);
    if (guestUsageIndex >= 0) {
      this.usedByGuests[guestUsageIndex].count += 1;
      this.usedByGuests[guestUsageIndex].lastUsedAt = new Date();
    } else {
      this.usedByGuests.push({
        phone: userPhone,
        count: 1,
        lastUsedAt: new Date(),
      });
    }
  }

  await this.save();
};

// Ensure virtuals are included in JSON
couponSchema.set('toJSON', { virtuals: true });
couponSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Coupon', couponSchema);
