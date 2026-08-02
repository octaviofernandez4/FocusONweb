const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    inviteToken: {
        type: String,
        unique: true,
        sparse: true
    },
    inviteTokenExpiresAt: {
        type: Date,
        default: null
    },
    logoUrl: {
        type: String,
        default: null
    },
    industry: {
        type: String,
        default: '',
        trim: true
    },
    address: {
        type: String,
        default: '',
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
