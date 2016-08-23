(function($) {
  $(".waiting-signin").css('z-index', '-1');

  function showErrorMessage(head, message) {
    AJS.messages.error({
      title : head,
      body : message
    });
    HipChat.resize();
  };
  
  function hideErrorMessage() {
      $("#aui-message-bar").find(".icon-close").click();
  };
  
  function isConnectedToFacebook(counter) {
    counter = counter - 1;
    if (counter > 0) {
      setTimeout(function() {
        $.ajax({
          url : isConnectedWithFacebookUrl,
          success : function(data) {
            if (!data.is_connected) {
              isConnectedToFacebook(counter);
            } else {
              window.location.reload();
            }
          },
          error : function() {
            isConnectedToFacebook(counter);
          },
          dataType : "json"
        });
      }, 5000);
    } else {
      message = "Failed to integrate with Facebook. Please close the Facebook tab and retry.";
      showErrorMessage("Timeout !", message);
    }
  };
  
  $(document).ready(function(e) {
    if (revoked === "true") {
      AJS.dialog2("#reauth-dialog").show();
    }
  });
  
  $("#dialog-close-button").click(function(e) {
    e.preventDefault();
    AJS.dialog2("#reauth-dialog").hide();
  });

  $(".sign-in-button").click(function() {
      hideErrorMessage();
    isConnectedToFacebook(60); // checks every 5 seconds until 5
                  // minutes/success
  });
})(AJS.$);