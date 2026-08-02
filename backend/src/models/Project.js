const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        // Tiene que coincidir con las claves de PROJECT_COLORS en
        // frontend/src/utils/projectColors.js
        type: String,
        enum: ['indigo', 'pink', 'emerald', 'amber', 'sky', 'violet', 'rose', 'teal'],
        default: 'indigo'
    },
    org: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
