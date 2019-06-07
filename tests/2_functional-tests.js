/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

        suite('API ROUTING FOR /api/threads/:board', function() {

                let thread_id;
                const BOARD_NAME = 'testSuite';
                const delete_password = 'password'

                suite('POST', function() {
                        test('Test POST /api/threads/{board} with text and password', function(done) {
                                chai.request(server)
                                        .post('/api/threads/' + BOARD_NAME)
                                        .send({
                                                text: 'POST thread',
                                                delete_password
                                        })
                                        .then(response => {
                                                assert.equal(response.status, 200);
                                                assert.isDefined(response.text);
                                                assert.include(response.redirects[0], '/b/' + BOARD_NAME);
                                                done();
                                        });
                        });
                });

                suite('GET', function() {
                        test('Test GET /api/threads/{board}', function(done) {
                                chai.request(server)
                                        .get('/api/threads/' + BOARD_NAME)
                                        .then(response => {
                                                assert.equal(response.status, 200);
                                                const threads = response.body;
                                                assert.isArray(threads);
                                                const firstThread = threads[0];
                                                assert.isDefined(firstThread._id);
                                                thread_id = firstThread._id;
                                                assert.isArray(firstThread.replies);
                                                assert.isDefined(firstThread.reply_count);
                                                assert.equal(firstThread.board, BOARD_NAME);
                                                assert.isDefined(firstThread.text);
                                                assert.isDefined(firstThread.created_on);
                                                assert.isDefined(firstThread.bumped_on);
                                                assert.isUndefined(firstThread.delete_password);
                                                assert.isUndefined(firstThread.reported);
                                                assert.isUndefined(firstThread.__v);
                                                done();
                                        });
                        });

                });

                suite('PUT', function() {
                        test('Test PUT /api/threads/{board} with thread_id', function(done) {
                                chai.request(server)
                                        .put('/api/threads/' + BOARD_NAME)
                                        .send({ thread_id })
                                        .then(response => {
                                                assert.equal(response.status, 200);
                                                assert.equal(response.text, 'success');
                                                done();
                                        });
                        });
                });

                suite('DELETE', function() {
                        test('Test DELETE /api/threads/{board} with thread_id and incorrect delete_password', function(done) {
                                chai.request(server)
                                        .delete('/api/threads/' + BOARD_NAME)
                                        .send({ thread_id, delete_password: delete_password + 'I' })
                                        .then(response => {
                                                assert.equal(response.status, 200);
                                                assert.equal(response.text, 'incorrect password');
                                                done();
                                        });
                        });

                        test('Test DELETE /api/threads/{board} with thread_id and delete_password', function(done) {
                                chai.request(server)
                                        .delete('/api/threads/' + BOARD_NAME)
                                        .send({ thread_id, delete_password })
                                        .then(response => {
                                                assert.equal(response.status, 200);
                                                assert.equal(response.text, 'success');
                                                done();
                                        });
                        });
                });
        });

        suite('API ROUTING FOR /api/replies/:board', function() {

                let thread_id;
                let reply_id;
                const BOARD_NAME = 'testSuite';
                const delete_password = 'password';

                suite('POST', function() {
                        test('Test POST /api/replies/{board}', function(done) {
                                chai.request(server)
                                        .post('/api/threads/' + BOARD_NAME)
                                        .send({
                                                text: 'thread for replies',
                                                delete_password
                                        })
                                        .then(response => {
                                                return chai.request(server)
                                                        .get('/api/threads/' + BOARD_NAME)
                                        })
                                        .then(response => {
                                                thread_id = response.body[0]._id;
                                                return chai.request(server)
                                                        .post('/api/replies/' + BOARD_NAME)
                                                        .send({
                                                                text: 'POST reply1',
                                                                delete_password,
                                                                thread_id
                                                        })
                                        })
                                        .then(response => {
                                                assert.equal(response.status, 200);
                                                assert.isDefined(response.text);
                                                assert.include(response.redirects[0], '/b/' + BOARD_NAME + '/' + thread_id);
                                                done();
                                        })
                                        .catch(error => {
                                                console.log(error);
                                        })
                        });
                });

                suite('GET', function() {
                        test('Test GET /api/replies/{board}', function(done) {
                                chai.request(server)
                                        .post('/api/replies/' + BOARD_NAME)
                                        .send({
                                                text: 'POST reply2',
                                                delete_password,
                                                thread_id
                                        })
                                        .then(response => {
                                                return chai.request(server)
                                                        .get('/api/replies/' + BOARD_NAME)
                                                        .query({ thread_id })
                                        })
                                        .then(response => {
                                                assert.equal(response.status, 200);
                                                const thread = response.body;
                                                assert.isDefined(thread._id);
                                                assert.equal(thread.replies.length, 2);
                                                assert.equal(thread.reply_count, 2);
                                                assert.equal(thread.board, BOARD_NAME);
                                                assert.isDefined(thread.text);
                                                assert.isDefined(thread.created_on);
                                                assert.isDefined(thread.bumped_on);
                                                assert.notEqual(thread.created_on, thread.bumped_on)
                                                assert.isUndefined(thread.delete_password);
                                                assert.isUndefined(thread.reported);
                                                assert.isUndefined(thread.__v);
                                                const reply1 = thread.replies[0];
                                                assert.isDefined(reply1._id);
                                                reply_id = reply1._id;
                                                assert.equal(reply1.text, 'POST reply1');
                                                assert.isUndefined(reply1.delete_password);
                                                assert.isUndefined(reply1.reported);
                                                done();
                                        })
                                        .catch(error => {
                                                console.log(error);
                                        })
                        });

                });

                suite('PUT', function() {
                        test('Test PUT /api/replies/{board} with thread_id and reply_id', function(done) {
                                chai.request(server)
                                        .put('/api/replies/' + BOARD_NAME)
                                        .send({ thread_id, reply_id })
                                        .then(response => {
                                                assert.equal(response.status, 200);
                                                assert.equal(response.text, 'success');
                                                done();
                                        })
                                        .catch(error => {
                                                console.log(error);
                                        });
                        });
                });

                suite('DELETE', function() {
                        test('Test DELETE /api/replies/{board}', function(done) {
                                chai.request(server)
                                        .delete('/api/replies/' + BOARD_NAME)
                                        .send({ thread_id, reply_id, delete_password })
                                        .then(response => {
                                                assert.equal(response.status, 200);
                                                assert.equal(response.text, 'success');
                                                return 1;
                                        })
                                        .then(() => {
                                                return chai.request(server)
                                                        .get('/api/replies/' + BOARD_NAME)
                                                        .query({ thread_id })
                                        })
                                        .then(response => {
                                                assert.equal(response.body.replies[0].text, '[deleted]')
                                                done();
                                        })
                                        .catch(error => {
                                                console.log(error);
                                        });
                        });

                });

                after(() => {
                        chai.request(server)
                                .delete('/api/threads/' + BOARD_NAME)
                                .send({ thread_id, delete_password })
                                .then(response => {
                                        console.log("Cleaned up");
                                })
                                .catch(error => {
                                        console.log(error);
                                });
                });
        });

});