import mongoose from 'mongoose';

const { Schema } = mongoose;

const portfolioCodeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // ─── Raw Code (for editing) ────────────
  rawHtml: { type: String, default: '' },

  // ─── Sanitized Code (for public preview)
  htmlContent: { type: String, default: '' },

  // ─── CSS & JS ──────────────────────────
  cssContent: { type: String, default: '' },
  jsContent: { type: String, default: '' },

  // ─── Visibility ────────────────────────
  isPublic: { type: Boolean, default: false },

}, {
  timestamps: true,
});

// ─── Indexes ──────────────────────────────
// userId index auto-created by unique: true
portfolioCodeSchema.index({ isPublic: 1 });

const PortfolioCode = mongoose.model('PortfolioCode', portfolioCodeSchema);

export default PortfolioCode;
