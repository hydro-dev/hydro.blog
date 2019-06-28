const Router = require('koa-router');
module.exports = class HYDRO_BLOG_ROUTER {
    constructor(item) {
        this.db = item.db;
        this.config = item.config;
        this.lib = item.lib;
        this.router = new Router({ prefix: this.config.path || '' });
        let blog = new (require('./blog'))(this.db);
        let md5 = require('./md5');
        this.router
            .use(async (ctx, next) => {
                ctx.state.theme = this.config.theme;
                ctx._404 = async info => {
                    await ctx.render('hydro.blog/404', { title: 'Page not found', info });
                };
                ctx._400 = async info => {
                    await ctx.render('hydro.blog/400', { title: 'Bad request', info });
                };
                ctx.state.blog_title = this.config.blog_title;
                ctx.state.gravatar = (email, size = 64) => {
                    return 'https://cn.gravatar.com/avatar/' + md5(email) + '?s=' + size;
                };
                await next();
            })
            .get('hydro_blog_home', '/', async ctx => {
                let page = ctx.query.page || 1;
                let [posts, total] = await blog.getMany(page);
                let categories = await blog.getCategories() || [];
                await ctx.render('hydro.blog/home', {
                    title: 'Home', posts, categories, curpage: page,
                    total: Math.floor(total / 10) + ((total % 10) ? 1 : 0)
                });
            })
            .get('hydro_blog_post', '/show/:postid', async ctx => {
                let post = await blog.get(ctx.params.postid);
                if (!post) await ctx._404([ctx.params.postid]);
                else {
                    let pre = await blog.getPre(post.time);
                    let next = await blog.getNext(post.time);
                    post.uname = (await this.lib.user.get_by_uid(post.uid)).uname;
                    let comments = await blog.getComment(ctx.params.postid);
                    await ctx.render('hydro.blog/post', { title: 'Post', post, pre, next, comments });
                }
            })
            .post('hydro_blog_comment', '/comment/:postid', async ctx => {
                let post = await blog.get(ctx.params.postid);
                if (!ctx.req.body.content) await ctx._400();
                else if (ctx.state.user.uid == 1) await ctx._400();
                else if (!post) await ctx._404([ctx.params.postid]);
                else if (ctx.req.body.content)
                    await blog.addComment(ctx.params.postid, ctx.state.user.uid, ctx.req.body.content);
                ctx.redirect(ctx.state.url('hydro_blog_post', ctx.params.postid));
            })
            .post('hydro_blog_comment_to_comment', '/comment/:postid/:id', async ctx => {
                let post = await blog.get(ctx.params.postid);
                let comment = await blog.getSingleComment(ctx.params.id);
                if (!ctx.req.body.content) await ctx._400();
                else if (ctx.state.user.uid == 1) await ctx._400();
                else if (!(post && comment)) await ctx._404([ctx.params.postid, ctx.params.id]);
                else if (ctx.req.body.content)
                    await blog.replyToComment(ctx.params.id, ctx.state.user.uid, ctx.req.body.content);
                ctx.redirect(ctx.state.url('hydro_blog_post', ctx.params.postid));
            })
            .all('hydro_blog_delete_comment', '/delete_comment/:postid/:commentid', async ctx => {
                let comment = await blog.getSingleComment(ctx.params.commentid);
                if (!comment) await ctx._404([ctx.params.commentid]);
                else if (comment.uid != ctx.state.user.uid) await ctx._400([ctx.state.user.uid]);
                else await blog.delComment(ctx.params.commentid);
                ctx.redirect(ctx.state.url('hydro_blog_post', ctx.params.postid));
            });
    }
}
