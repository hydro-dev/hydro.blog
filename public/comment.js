$(document).ready(function () {
    $('.reply-to-comment').on('click', function (e) {
        var rid = e.currentTarget.dataset.id;
        $('#comment-form').detach().appendTo($(e.currentTarget).parents('.one-comment[data-id="' + rid + '"]'));
        $('input[name="reply_to"]', '#comment-form').remove();
        var a = $('<input type="hidden" name="reply_to" />');
        a.val(rid);
        a.appendTo('#comment-form form');
        $('#cancel-reply').css('display', 'inline-block');
        // window.location.hash = "comment-form"
    });
    $('#cancel-reply').on('click', function (e) {
        e.preventDefault();
        $(e.currentTarget).css('display', 'none');
        $('input[name="reply_to"]', '#comment-form').remove();
        $('#comment-form').detach().appendTo('#comment-form-wrapper');
        // window.location.hash = "comment-form-wrapper"
    });
});
