const mongoose = require('mongoose');
const validator = require('validator');
const passwordValidator = require('../util/password-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const schema = {
    _id: {
        type: String
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Invalid Email Address');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (!passwordValidator.validate(value)) {
                throw new Error('Invalid Password');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be positive.');
            }
        }
    },
    active: {
        type: Boolean,
        default: true
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
};

const userSchema = new mongoose.Schema(schema, {
    timestamps: true
});

// userSchema.virtual('myAccessRequests', {
//     ref: 'AccessRequest',
//     localField: '_id',
//     foreignField: 'applicant'
// });

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error('No user found with this email ID !');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('Invalid Credentials !!!');
    }
    return user;
};

userSchema.methods.generateAuthToken = async function () {
    const user = this;

    const token_options = {
        expiresIn: '6h'
    };

    const token = jwt.sign({ _id: user._id.toString()}, process.env.TOKEN_PRIVATE_KEY, token_options);
    user.tokens = [...user.tokens, {token}];
    await user.save();
    
    return token;
};

userSchema.methods.toJSON = function () {
    const user = this;
    const userObj = user.toObject();

    delete userObj.avatar;
    delete userObj.tokens;
    delete userObj.password;

    return userObj;
}

userSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

// don't delete tasks even if user gets deleted
// userSchema.pre('remove', async function (next) {
//     const user = this;
//     await Task.deleteMany({ reporter: user._id });

//     next();
// });

const User = mongoose.model('User', userSchema);

module.exports = User;