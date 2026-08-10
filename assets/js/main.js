$(document).ready(function () {

    ////////////////////////////////////////
    // Shared helpers
    ////////////////////////////////////////

    const trackSubscribeClick = function (event) {
        if ( typeof gtag !== 'function' ) {
            return;
        }

        const subscribe_target = event.currentTarget;

        gtag('event', 'click_subscribe', {
            page: window.location.pathname,
            place: subscribe_target.dataset.subscribeClick,
        });
    };

    const queueSubscribeModal = function (subscribe_trigger) {
        const parent_modal_selector = subscribe_trigger.data('subscribe-parent-modal');
        const subscribe_modal = $('#subscribeModal');

        if ( !parent_modal_selector || !subscribe_modal.length ) {
            return;
        }

        const parent_modal = $(parent_modal_selector);

        if ( !parent_modal.length ) {
            subscribe_modal.modal('show');
            return;
        }

        parent_modal.one('hidden.bs.modal', function () {
            subscribe_modal.modal('show');
        });

        parent_modal.modal('hide');
    };

    ////////////////////////////////////////
    // Mutation observer - watch for RTL
    ////////////////////////////////////////

    const target = document.querySelector('html');

    const observer = new MutationObserver( function(mutations) {
        mutations.forEach( function() {
            const classes = target.getAttribute('class') || '';
            const single_class = 'translated-rtl';

            if ( classes.includes(single_class) ) {
                target.setAttribute('dir', 'rtl');
            } else {
                target.setAttribute('dir', 'ltr');
            }
        });
    });

    const config = {
        attributes: true,
        attributeFilter: ['class']
    }

    observer.observe(target, config);

    ////////////////////////////////////////
    // Language, Search, and Menu Toggle
    ////////////////////////////////////////

    $('#global-language').on('show.bs.collapse', function () {
        $('#global-search').collapse('hide');
        $('#nav-primary').collapse('hide');
    });

    $('#global-search').on('show.bs.collapse', function () {
        $('#global-language').collapse('hide');
        $('#nav-primary').collapse('hide');
    });

    $('#nav-primary').on('show.bs.collapse', function () {
        $('#global-search').collapse('hide');
        $('#global-language').collapse('hide');
    });

    ////////////////////////////////////////
    // Language and Search Toggle Focus
    ////////////////////////////////////////

    $('#global-language').on('shown.bs.collapse', function () {
        $('.goog-te-combo').focus();
    }).on('show.bs.collapse', function () {
        $('.goog-te-combo').blur();
    });

    $('#global-search').on('shown.bs.collapse', function () {
        document.getElementById('global-search-bar').focus();
    }).on('show.bs.collapse', function () {
        document.getElementById('global-search-bar').blur();
    });

    ////////////////////////////////////////
    // Subscribe links and modal
    ////////////////////////////////////////

    const subscribe_triggers = $('[data-subscribe-click]');

    if ( subscribe_triggers.length ) {
        subscribe_triggers.on('click', function (event) {
            const subscribe_trigger = $(this);

            trackSubscribeClick(event);

            if ( subscribe_trigger.data('subscribe-parent-modal') ) {
                event.preventDefault();
                queueSubscribeModal(subscribe_trigger);
            }
        });
    }

    const subscribe_modal = $('#subscribeModal');

    if ( subscribe_modal.length ) {

        subscribe_modal.on('show.bs.modal', function () {
            const subscribe_form = $(this);
            const subscribe_modal_body = subscribe_form.find('.modal-body');
            const subscribe_placeholder = subscribe_modal_body.find('.subscribe-form-placeholder');
            const subscribe_form_url = subscribe_form.data('subscribe-form-url');

            if ( !subscribe_form_url || subscribe_modal_body.find('.subscribe-form-frame').length ) {
                return;
            }

            const subscribe_iframe = $('<iframe>', {
                'class': 'subscribe-form-frame',
                width: '100%',
                height: '100%',
                frameborder: '0',
                title: 'Subscription form'
            }).css({
                display: 'none',
                position: 'absolute',
                inset: 0,
                border: 0,
            });

            subscribe_iframe.one('load', function () {
                subscribe_placeholder.removeClass('d-flex').addClass('d-none');
                subscribe_iframe.css('display', 'block');
            });

            subscribe_iframe.attr('src', subscribe_form_url);
            subscribe_modal_body.append(subscribe_iframe);
        });
    }

    ////////////////////////////////////////
    // Back to top
    ////////////////////////////////////////

    const scroll_speed = 800;

    if( $('#back-to-top').length ){

        $('#back-to-top > a').click(function() {
            $('body, html').animate({
                scrollTop: 0
            }, scroll_speed );
        });

        $(window).scroll(function() {

            const window_scroll = $(document).scrollTop();
            const primary_content = $('#primary-content').offset().top;

            if ( window_scroll > primary_content ) {
                $('#back-to-top').addClass('show');
            } else {
                $('#back-to-top').removeClass('show');
            }

        }).scroll();
    }

});

////////////////////////////////////////
// Google Translate Links
////////////////////////////////////////

$('.lang-select').click(function (e) {
    e.preventDefault();
    const lang = $(this).attr('data-lang')
    setLanguage(lang);
});

function setLanguage(theLang) {
    const theSelect = $('.goog-te-combo');
    const db = theSelect.get(0);
    theSelect.val(theLang);
    fireEvent(db, 'change');
}

function fireEvent(element, event) {
    if (document.createEventObject) {
        const evt = document.createEventObject();
        return element.fireEvent('on' + event, evt)
    } else {
        const evt = document.createEvent("HTMLEvents");
        // event type, bubbling, cancelable
        evt.initEvent(event, false, true); 
        return !element.dispatchEvent(evt);
    }
}