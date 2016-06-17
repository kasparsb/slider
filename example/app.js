var $ = jQuery;

var slider = $('.slider').get(0);
var items = [];
$('.slider .item').each(function(){
    items.push(this);
})

var s = new webit.Slider(
    slider,
    items
);

$(document).on('click', 'button', function(){
    if ($(this).hasClass('prev')) {
        s.prev();
    }
    else if ($(this).hasClass('next')) {
        s.next();
    }
})