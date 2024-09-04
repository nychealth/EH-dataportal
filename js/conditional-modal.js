
$(window).on('load', function() {
    openModal();
});

function openModal() {
    
    var SESSION_VALUE = 'EHDP-modal-timestamp';
    var TEST_TIME_DIFF = 1000 * 60 * 60 * 24; // ms * sec * min * hrs
    // var TEST_TIME_DIFF = 1000 * 10; // ms * sec
    
    if (localStorage) {
        
        // if session storage exists, see if there's a timestamp saved
        
        var session = localStorage.getItem(SESSION_VALUE);
        
        if (session) {
            
            // if there's a timestamp saved, test the duration rule
            
            var actual_time_diff = Date.now() - session;
            
            if (actual_time_diff < TEST_TIME_DIFF) {
                
                // if it's within TEST_TIME_DIFF, don't show the modal
                
                $('#prototypeModal').modal('hide');
                
            } else {
                
                // if it's outside of TEST_TIME_DIFF, show the modal
                
                $('#prototypeModal').modal('show');
                
            }

        } else {
            
            // if there's no SESSION_VALUE timestamp value, show the modal
            
            $('#prototypeModal').modal('show');
            
        }
        
    } else {
        
        // if no 'localStorage' available, show the modal
        
        $('#prototypeModal').modal('show');
        
    }
    
    // update SESSION_VALUE timestamp value on close/hide
    
    $('#prototypeModal').on('hide.bs.modal', function (e) {
        
        var date_now = Date.now();
        
        if (localStorage) {
            localStorage.setItem(SESSION_VALUE, date_now);
        }
        
    });
    
};
