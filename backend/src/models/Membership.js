const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
    org: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
    }
}, { timestamps: true });

membershipSchema.index({ org: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Membership', membershipSchema);
