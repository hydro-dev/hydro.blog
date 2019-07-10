'use strict';

const
    bson = require('bson'),
    md = require('markdown-it')();

module.exports = class BLOG {
    constructor(item) {
        this.db = item.db;
    }
    get(postid) {
        return this.db.collection('posts').findOne({ id: postid });
    }
    async getMany(page) {
        let posts = await this.db.collection('posts').find()
            .sort({ time: -1 }).limit(10).skip(10 * (page - 1)).toArray();
        let info = await this.db.collection('posts').find().explain();
        return [posts, info.executionStats.nReturned];
    }
    getCategories() {
        return [];
    }
    async getPre(time) {
        let res = await this.db.collection('posts').find({ time: { $lt: time } })
            .limit(1).sort({ time: -1 }).toArray();
        if (res.length) return res[0];
        else return null;
    }
    async getNext(time) {
        let res = await this.db.collection('posts').find({ time: { $gt: time } })
            .limit(1).sort({ time: 1 }).toArray();
        if (res.length) return res[0];
        else return null;
    }
    async add(uid, title, type, content, tags) {
        let user = await this.db.collection('user').findOne({ uid });
        if (!user) throw new Error('User not found!');
        let post = {
            id: new bson.ObjectID().toHexString(),
            uid, uname: user.uname, author: user.uname, email: user.email,
            title, type, content, time: new Date(), tags
        };
        await this.db.collection('posts').insertOne(post);
        return post.id;
    }
    async addComment(id, uid, content) {
        let post = await this.db.collection('posts').findOne({ id });
        if (!post) throw new Error('Post not found!');
        let user = await this.db.collection('user').findOne({ uid });
        if (!user) throw new Error('User not found!');
        let comment = {
            for: id, uname: user.uname, email: user.email,
            id: new bson.ObjectID().toHexString(), depth: 1,
            uid, content, time: new Date()
        };
        return await this.db.collection('comments').insertOne(comment);
    }
    async replyToComment(id, uid, content) {
        let parent = await this.db.collection('comments').findOne({ id });
        if (!parent) throw new Error('Comment not found!');
        let user = await this.lib.user.get_by_uid(uid);
        while (parent.depth > 1)
            parent = await this.db.collection('comments').findOne({ id: parent.for });
        if (!user) throw new Error('User not found!');
        let comment = {
            for: parent.id, uid, uname: user.uname, email: user.email,
            id: new bson.ObjectID().toHexString(), depth: 2,
            content, time: new Date()
        };
        return await this.db.collection('comments').insertOne(comment);
    }
    delComment(id) {
        return Promise.all([
            this.db.collection('comments').deleteOne({ id, depth: 1 }),
            this.db.collection('comments').deleteMany({ for: id, depth: 2 })
        ]);
    }
    getSingleComment(id) {
        return this.db.collection('comments').findOne({ id });
    }
    async getComment(postid) {
        let comments = await this.db.collection('comments').find({ for: postid, depth: 1 }).toArray();
        for (let i in comments)
            comments[i].comments = await this.db.collection('comments').find({ for: comments[i].id, depth: 2 }).toArray();
        return comments;
    }
    getSubComment(id) {
        return this.db.collection('comments').find({ for: id, depth: 2 }).toArray();
    }
    render(text, type) {
        if (type == 'markdown') return md.render(text);
        else if (type == 'html') return text;
        else {
            return 'Type not supported';
        }
    }
};
