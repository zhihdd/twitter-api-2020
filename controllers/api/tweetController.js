const db = require('../../models')
const Tweet = db.Tweet
const User = db.User
const defaultLimit = 10

let tweetController = {
  getUserTweets: (req, res) => {
    const options = {
      limit: +req.query.limit || defaultLimit,
      offset: +req.query.offset || 0,
      attributes: ['id', 'description', 'likeNum', 'replyNum', 'createdAt'],
      order: [['createdAt', 'desc']],
      subQuery: false,
      include: [
        {
          model: User,
          attributes: ['id', 'account', 'name', 'avatar'],
          as: 'Author',
          where: { role: 'user' }
        },
        {
          model: User,
          as: 'LikedUsers',
          attributes: ['id']
        }
      ],
      where: { UserId: +req.params.id }
    }
    Tweet.findAll(options)
      .then((tweets) => {
        tweets = tweets.map((tweet) => {
          tweet.dataValues.isLike = tweet.dataValues.LikedUsers.some(
            (likedUser) => likedUser.id === +req.user.id
          )
          delete tweet.dataValues.LikedUsers
          return tweet
        })
        return res.status(200).json(tweets)
      })
      .catch((error) =>
        res.status(500).json({
          status: 'error',
          message: error
        })
      )
  },
  getTweets: (req, res) => {
    const options = {
      limit: +req.query.limit || defaultLimit,
      offset: +req.query.offset || 0,
      attributes: ['id', 'description', 'likeNum', 'replyNum', 'createdAt'],
      order: [['createdAt', 'desc']],
      subQuery: false,
      include: [
        {
          model: User,
          attributes: ['id', 'account', 'name', 'avatar'],
          as: 'Author',
          where: { role: 'user' }
        },
        {
          model: User,
          as: 'LikedUsers',
          attributes: ['id'],
          through: {
            attributes: []
          }
        }
      ]
    }
    Tweet.findAll(options).then((tweets) => {
      tweets = tweets.map((tweet) => {
        const { id, description, likeNum, replyNum, createdAt, updatedAt, Author } = tweet
        return {
          id,
          isLike: tweet.LikedUsers.some((user) => user.id === +req.user.id),
          description,
          likeNum,
          replyNum,
          createdAt,
          updatedAt,
          Author
        }
      })
      return res.status(200).json(tweets)
    })
      .catch((error) => res.status(500).json({
        status: 'error',
        message: error
      }))
  },
  getTweet: (req, res) => {
    const options = {
      attributes: ['id', 'description', 'likeNum', 'replyNum', 'createdAt', 'updatedAt'],
      include: [
        {
          model: User,
          as: 'Author',
          attributes: ['id', 'account', 'name', 'avatar']
        },
        {
          model: User,
          as: 'LikedUsers',
          attributes: ['id'],
          through: {
            attributes: []
          }
        }
      ]
    }
    Tweet.findByPk(+req.params.tweetId, options)
      .then((tweet) => {
        tweet = tweet.toJSON()
        const { id, description, likeNum, replyNum, createdAt, updatedAt, Author } = tweet
        if (tweet) {
          return res.status(200).json({
            id,
            isLike: tweet.LikedUsers.some((user) => user.id === +req.user.id),
            description,
            likeNum,
            replyNum,
            createdAt,
            updatedAt,
            Author
          })
        }
        return res
          .status(404)
          .json({
            status: 'error',
            message: 'Tweet not found.'
          })
      })
      .catch((error) => res.status(500).json({
        status: 'error',
        message: error
      }))
  },
  postTweet: (req, res) => {
    if (!req.body.description) {
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'Cannot post empty description.'
        })
    }
    if (req.body.description.length > 140) {
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'Cannot post over 140 characters.'
        })
    }
    const data = {
      UserId: +req.user.id,
      description: req.body.description,
      likeNum: 0,
      replyNum: 0
    }
    Tweet.create(data)
      .then((tweet) => {
        User.findByPk(+req.user.id)
          .then((user) => user.increment({ tweetNum: 1 }))
          .then(() =>
            res.status(200).json({
              status: '200',
              message: 'Successfully posted new tweet.',
              Tweet: tweet
            })
          )
      })
      .catch((error) =>
        res.status(500).json({
          status: 'error',
          message: error
        })
      )
  }
}

module.exports = tweetController
