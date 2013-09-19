

$(document).ready(function () {
    $("#joinChatButton").click(function (e) {
        e.preventDefault();
        $("#loginModal").modal('show');
        $("#loginModal").on('shown', function () {
            $("#userName").focus();
        });
    });
    
    $("#leaveChatButton").click(function (e) {
        e.preventDefault();
        window.location = "/Home/LeaveChat";
    });

    $("#joinChatConclusionButton").click(function (e) {
        e.preventDefault();
        var $userName = $("#userName");
        var $email = $("#email");

        // add validation error if not defined
        if (!$userName.val() || $userName.val() == $userName.attr("placeHolder"))
            $userName.closest(".control-group").addClass("error");
        else {
            window.location = "/Home/JoinChat?userName=" + $userName.val() + "&email=" + $email.val();
        }
    });
    
    // if the user presses anything, remove the validation error
    $("#userName").keypress(function() {
        $(this).closest(".control-group").removeClass("error");
    });
});