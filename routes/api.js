/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

var expect = require('chai').expect;

const MongoClient = require('mongodb').MongoClient;
const CONNECTION_STRING = process.env.DB;

const mongoose = require('mongoose');
mongoose.connect(CONNECTION_STRING, {
        useNewUrlParser: true,
        useFindAndModify: false
});

const Schema = mongoose.Schema;
const threadSchema = new Schema({
        board: { type: String, required: true },
        text: { type: String, required: true },
        created_on: { type: Date, required: true },
        bumped_on: { type: Date, required: true },
        reported: { type: Boolean, default: false },
        delete_password: { type: String, required: true },
        replies: [{ type: Schema.Types.ObjectId, ref: 'Reply', default: [] }],
        reply_count: { type: Number, default: 0}
});

const Thread = mongoose.model('Thread', threadSchema, 'threads');

const replySchema = new Schema({
        // thread_id: { type: String, required: true },
        text: { type: String, required: true },
        created_on: { type: Date, required: true },
        reported: { type: Boolean, default: false },
        delete_password: { type: String, required: true }
});

const Reply = mongoose.model('Reply', replySchema, 'replies');

module.exports = function(app) {

        app.route('/api/threads/:board')
                .get((request, response) => {
                        const board = request.params.board;
                        const populateFormat = {
                                path: 'replies',
                                select: '-reported -delete_password',
                                options: {
                                        sort: 'created_on',
                                        limit: 3
                                }}
                        const query  = Thread.find({ board }, '-reported -delete_password -__v')
                         .sort('-bumped_on').limit(10).populate(populateFormat);
                        query
                         .exec()
                         .then(threads => {

                                response.send(threads);
                         }).catch(error => {
                                console.log(error.message);
                                response.send('please try later');
                         });
                })

                .post((request, response) => {
                        const board = request.params.board;
                        const text = request.body.text;
                        const delete_password = request.body.delete_password;
                        const date = new Date();
                        const thread = new Thread({
                                board,
                                text,
                                delete_password,
                                created_on: date,
                                bumped_on: date
                        });
                        thread.save()
                         .then(thread => {
                                 const boardUrl = '/b/' + board + '/';
                                 response.redirect(boardUrl);
                         })
                         .catch(error => {
                                 console.log(error);
                                 // TODO do something
                         });
                })

                .put((request, response) => {
                        const board = request.params.board;
                        const _id = request.body.thread_id;
                        Thread.updateOne({ _id }, { reported: true })
                         .exec()
                         .then(result => {
                                 response.send("success");
                         })
                         .catch(error => {
                                 console.log(error);
                         })
                })

                .delete((request, response) => {
                        // const board = request.params.board;
                        const _id = request.body.thread_id;
                        const delete_password = request.body.delete_password;
                        Thread.findOneAndRemove({ _id, delete_password}).exec()
                         .then(thread => {
                                 if (thread == null) {
                                         return Promise.reject(new Error('incorrect password'));
                                 }

                                 return Reply.deleteMany({ _id: { $in: thread.replies } }).exec();
                         })
                         .then( () => {
                                response.send('success');
                         })
                         .catch(error => {
                                 if (error.message == 'incorrect password') {
                                         response.send('incorrect password');
                                 } else {
                                         console.log(error.message);
                                         // TODO what next?
                                 }
                         })
                });

        app.route('/api/replies/:board')
                .get((request, response) => {
                        // const board = request.params.board;
                        const _id = request.query.thread_id;
                        const query  = Thread.findById( _id, '-reported -delete_password -__v')
                         .populate('replies', '-reported -delete_password -__v');
                        query
                         .exec()
                         .then(thread => {
                                response.send(thread);
                         }).catch(error => {
                                console.log(error.message);
                                response.send('please try later');
                         });
                })

                .post((request, response) => {
                        const board = request.params.board;
                        const thread_id = request.body.thread_id;
                        const text = request.body.text;
                        const delete_password = request.body.delete_password;
                        const now = new Date();
                        const reply = new Reply({ text, created_on: now, delete_password });
                        reply.save()
                         .then(reply => {
                                 const update_data = {
                                         bumped_on: now,
                                         $push: { replies: reply._id },
                                         $inc: { reply_count: 1 }
                                 };
                                 return Thread.findByIdAndUpdate(thread_id, update_data).exec();
                         })
                         .then( doc => {
                                 const threadUrl = '/b/' + board + '/' + thread_id;
                                 response.redirect(threadUrl);
                         })
                         .catch(error => {
                                 console.log(error);
                                 // TODO do something
                         });
                })

                .put((request, response) => {
                        const _id = request.body.reply_id;
                        Reply.updateOne({ _id }, { reported: true })
                         .exec()
                         .then(result => {
                                 response.send("success");
                         })
                         .catch(error => {
                                 console.log(error);
                         })

                })

                .delete((request, response) => {
                        const board = request.params.board;
                        // const thread_id = request.body.thread_id;
                        const reply_id = request.body.reply_id;
                        const delete_password = request.body.delete_password;
                        Reply.updateOne({ _id: reply_id, delete_password }, { text: '[deleted]' })
                         .exec()
                         .then( update_response => {
                                 if (update_response.n == 1) {
                                         response.send('success');
                                 } else {
                                        response.send('incorrect password');
                                 }
                         })
                         .catch(error => {
                                 console.log(error.message);
                                 // response.send('incorrect password');
                         });
                });

};