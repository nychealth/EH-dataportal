$(window).on('load',function() {
    
    $('.flake.desktop').popover({
        trigger: 'focus',
        html: true,
        container: '.main',
        content: function(){
            var id = $(this).attr('id')
            return $('#popover-content-' + id).find('.modal-body').html();
        }
    })

	/*  // the following code is not necessary due to modal being activated by data attributes: https://getbootstrap.com/docs/4.0/components/modal/#via-data-attributes
    $('.flake.mobile').modal({
        backdrop: false,
    });
	*/

    if($(window).width() <= 520) {
        $('.clickables').css('height',$('.indoor-bg.mobile').height());
        $('.indoor').css('height',$('.indoor-bg.mobile').height());
        $('.outdoor').css('height',$('.outdoor-bg.mobile').height());
        canvas.width = $('.indoor-bg.mobile').width();
        canvas.height = $('.indoor-bg.mobile').height();
    } else {
        $('.clickables').css('height',$('.indoor-bg').height());
        $('.indoor').css('height',$('.indoor-bg').height());
        $('.outdoor').css('height',$('.outdoor-bg').height());
        canvas.width = $('.indoor-bg').width();
        canvas.height = $('.indoor-bg').height();
    }

    window.addEventListener('resize', function(){
        
        if($(window).width() <= 520) {
            $('.indoor .clickables').css('height',$('.indoor-bg.mobile').height());
            $('.outdoor .clickables').css('height',$('.outdoor-bg.mobile').height());
            $('.indoor').css('height',$('.indoor-bg.mobile').height());
            $('.outdoor').css('height',$('.outdoor-bg.mobile').height());
        } else {
            $('.indoor .clickables').css('height',$('.indoor-bg').height());
            $('.outdoor .clickables').css('height',$('.outdoor-bg').height());
            $('.indoor').css('height',$('.indoor-bg').height());
            $('.outdoor').css('height',$('.outdoor-bg').height()); 
        }
        if($('.indoor').css('display') == 'none') {
            if($(window).width() <= 520) {
                canvas.width = $('.outdoor-bg.mobile').width();
                canvas.height = $('.outdoor-bg.mobile').height();
            } else {
                canvas.width = $('.outdoor-bg').width();
                canvas.height = $('.outdoor-bg').height(); 
            }
        } else {
            if($(window).width() <= 520) {
                canvas.width = $('.indoor-bg.mobile').width();
                canvas.height = $('.indoor-bg.mobile').height();
            } else {
                canvas.width = $('.indoor-bg').width();
                canvas.height = $('.indoor-bg').height(); 
            }
        }
        
    });

    $('.go').on('click',function(e){
        
        e.preventDefault();
        if($('.indoor').css('display') == 'none') {

                

            $('.indoor').css('display','block');
            $('.outdoor').css('display','none');
            $(canvas).removeClass('canvasoutside');
            
            if($(window).width() <= 520) {
                $('.clickables').css('height',$('.indoor-bg.mobile').height());
                $('.indoor').css('height',$('.indoor-bg.mobile').height());
                canvas.width = $('.indoor-bg.mobile').width();
                canvas.height = $('.indoor-bg.mobile').height();
            } else {
                $('.clickables').css('height',$('.indoor-bg').height());
                $('.indoor').css('height',$('.indoor-bg').height());
                canvas.width = $('.indoor-bg').width();
                canvas.height = $('.indoor-bg').height();    
            }
            
           
        } else {
                $('.outdoor').css('display','block');
                $('.indoor').css('display','none');
                $(canvas).addClass('canvasoutside');
            if($(window).width() <= 520) {
                $('.clickables').css('height',$('.outdoor-bg.mobile').height());
                $('.outdoor').css('height',$('.outdoor-bg.mobile').height());
                canvas.width = $('.outdoor-bg.mobile').width();
                canvas.height = $('.outdoor-bg.mobile').height();
            } else {
                $('.clickables').css('height',$('.outdoor-bg').height());
                $('.outdoor').css('height',$('.outdoor-bg').height());
                canvas.width = $('.outdoor-bg').width();
                canvas.height = $('.outdoor-bg').height();
            }
            
        }
        $("<p style='position:absolute;top: -10000px;' role='alert'>A new scene has loaded.</p>").appendTo(document.body)
        snow();
        setTimeout(pause,2000);


    });
})