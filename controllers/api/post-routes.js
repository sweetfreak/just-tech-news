const router = require('express').Router();
const { Post, User, Vote, Comment } = require('../../models');
const sequelize = require('../../config/connection');
const withAuth = require('../../utils/auth');


// get all users
router.get('/', (req, res) => {
    //console.log('====================');
    Post.findAll({
      order: [['created_at', 'DESC']],
      attributes: [
        'id', 
        'post_url', 
        'title', 
        'created_at', 
        [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id)'), 'vote_count']
    ],
      include: [
        {
          model: Comment,
          attributes: ['id', 'comment_text', 'post_id', 'user_id', 'created_at'],
          include: {
            model: User,
            attributes: ['username']
          }
        },
        {
          model: User,
            attributes: ['username']
        }
      ]
    })
      .then(dbPostData => res.json(dbPostData))
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  });

  router.get('/:id', (req, res) => {
    Post.findOne({
      where: {
        id: req.params.id
      },
      attributes: ['id', 'post_url', 'title', 'created_at', [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id)'), 'vote_count']
    ],
      include: [
        {
          model: Comment,
          attributes: ['id', 'comment_text', 'post_id', 'user_id', 'created_at'],
          include: {
            model: User,
            attributes: ['username']
          }
        },
        {
          model: User,
            attributes: ['username']
        }
      ]
    })

    .then(dbPostData => {
      if (!dbPostData) {
        res.status(404).json({ message: 'No post found with this id'});
        return;
      }
      res.json(dbPostData);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
  })

router.post('/', withAuth, (req, res) => {
  Post.create({
    title: req.body.title,
    post_url: req.body.post_url,
    user_id: req.session.user_id
  })
  .then(dbPostData => res.json(dbPostData))
  .catch(err => {
    console.log(err);
    res.status(500).json(err);
  })
})

//PUT /api/posts/upvote
//MUST be before the: router.put('/:id) because otherwise it'll think '/upvote' is an id!
router.put('/upvote', withAuth, (req, res) => {
  // make sure the session exists first
  if (req.session) {
    // pass session id along with all destructured properties on req.body
    Post.upvote({ ...req.body, user_id: req.session.user_id }, { Vote, Comment, User })
      .then(updatedVoteData => res.json(updatedVoteData))
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  }
});
  //custom statis method created in models/Post.js
  


  // MOVED THE BELOW TO THE UPVOTE METHOD IN POST.js
  // Vote.create({
  //   user_id: req.body.user_id,
  //   post_id: req.body.post_id
  // }).then(() => {
  //   // then find the post we just voted on
  //   return Post.findOne({
  //     where: {
  //       id: req.body.post_id
  //     },
  //     attributes: [
  //       'id',
  //       'post_url',
  //       'title',
  //       'created_at',
  //       // use raw MySQL aggregate function query to get a count of how many votes the post has and return it under the name `vote_count`
  //       [
  //         sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id)'),
  //         'vote_count'
  //       ]
  //     ]
  //   })
  // .then(dbPostData => res.json(dbPostData))
  //   .catch(err => {
  //     console.log(err);
  //     res.status(400).json(err);
  //   });
  // });


router.put('/:id', withAuth, (req, res) => {
  Post.update(
    {
      title: req.body.title
    },
    {
      where: {
        id: req.params.id
      }
    }
  )
    .then(dbPostData => {
      if (!dbPostData) {
        res.status(404).json({ message: 'No post found with this id' });
        return;
      }
      res.json(dbPostData);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.delete('/:id', withAuth, (req, res) => {
  Post.destroy({
    where: {
      id: req.params.id
    }
  })
    .then(dbPostData => {
      if (!dbPostData) {
        res.status(404).json({ message: 'No post found with this id' });
        return;
      }
      res.json(dbPostData);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;