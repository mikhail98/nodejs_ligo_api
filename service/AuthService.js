const User = require('../model/user')
const DeletedUser = require("../model/deleted_user")

const Error = require('../utils/errors')

const createJWT = require('../utils/createJWT')
const verifyGoogleToken = require('../utils/googleTokenVerifier')

class AuthService {

    static async login(email, googleToken, res) {
        const user = await User.findOne({email})

        if (!user) {
            return res.status(400).send(Error.noSuchUser)
        }

        if (googleToken) {
            const isValidGoogleToken = await verifyGoogleToken(user.email, googleToken)
            if (!isValidGoogleToken) {
                return res.status(400).send(Error.invalidGoogleToken)
            }
        } else {
            return res.status(400).send(Error.requiredToken)
        }

        user.token = createJWT(user._id)
        user.fcmTokens = []

        return res.status(200).send(user)
    }

    static async logout(user, fcmToken, res) {
        const _id = user._id
        user.fcmTokens = user.fcmTokens.filter(token => token !== fcmToken)

        return User.updateOne({_id}, user)
            .then(() => {
                return res.status(200).send()
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async deleteUser(user, res) {
        return User.updateOne(
            {
                _id: user._id
            }, {
                name: user._id,
                email: user._id,
                ratings: [],
                phone: null,
                token: null,
                fcmTokens: [],
                location: null,
                isAdmin: false,
                avatarUrl: null,
                isDeleted: true,
                passportPhotoUrl: null
            }
        )
            .then(function () {
                return DeletedUser.create({userId: user._id, email: user.email})
                    .then(() => {
                        return res.status(200).send()
                    })
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

}

module.exports = AuthService