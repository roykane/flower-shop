const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: String,
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: String,
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: String,
  address: {
    type: String,
    required: true,
  },
  apartment: String,
  // Vietnamese address format
  ward: String,        // Phường/Xã
  district: String,    // Quận/Huyện
  province: String,    // Tỉnh/Thành phố
  // Legacy fields (optional for Vietnamese format)
  city: String,
  state: String,
  zipCode: String,
  country: {
    type: String,
    default: 'Vietnam',
  },
});

// Counter schema for auto-increment order code
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      unique: true,
      sparse: true, // Allow null for migration of old orders
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for guest checkout
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'cash_on_delivery', 'cod', 'bank_transfer', 'momo'],
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentDetails: {
      transactionId: String,
      paidAt: Date,
    },
    paymentProof: {
      image: String,        // Path to uploaded payment screenshot
      uploadedAt: Date,
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      note: String,         // Admin note when verifying
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    subtotal: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    couponCode: String,
    discount: {
      type: Number,
      default: 0,
    },
    deliveryDate: Date,
    deliveryTime: String,
    giftMessage: String,
    note: String,
    notes: String,
    statusHistory: [
      {
        status: String,
        date: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Generate order code (DH00001, DH00002, etc.)
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Generate order code
    if (!this.orderCode) {
      try {
        const counter = await Counter.findByIdAndUpdate(
          { _id: 'orderCode' },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        this.orderCode = 'DH' + String(counter.seq).padStart(5, '0');
      } catch (error) {
        console.error('Error generating order code:', error);
        // Fallback to timestamp-based code
        this.orderCode = 'DH' + Date.now().toString().slice(-8);
      }
    }

    // Add initial status history
    this.statusHistory.push({
      status: this.orderStatus,
      note: 'Order created',
    });
  }
  next();
});

// Update status history when order status changes
orderSchema.pre('save', function (next) {
  if (this.isModified('orderStatus') && !this.isNew) {
    this.statusHistory.push({
      status: this.orderStatus,
      date: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
